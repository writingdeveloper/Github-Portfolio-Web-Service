require('dotenv').config() // To load Environment Vars
const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const request = require("request");
const moment = require('moment-timezone');
const morgan = require('morgan');
const rfs = require('rotating-file-stream')
const rateLimit = require("express-rate-limit");
const fs = require('fs')
const app = express();


/* HTTP(dev) HTTPS(production) settings */
const https = require('https')
const http = require('http')
const PORT = process.env.PORT || 443;
const domain = 'expressme.dev'; // Domain Name
const option = process.env.NODE_ENV === "production" ? {
    ca: fs.readFileSync('/etc/letsencrypt/live/' + domain + '/fullchain.pem'),
    key: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain + '/privkey.pem'), 'utf8').toString(),
    cert: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain + '/cert.pem'), 'utf8').toString(),
  } :
  undefined;

// In Production Mode use HTTPS Server
// In Development Mode use HTTP Server
let socket;
/* HTTPS Server */
option
  ?
  socket = https.createServer(option, app).listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
  }) :
  undefined;
/* HTTP Server */
option
  ?
  socket = http.createServer(function (req, res) {
    res.writeHead(301, {
      Location: "https://" + req.headers["host"] + req.url
    });
    res.end();
  })
  .listen(80) :
  socket = http.createServer(app).listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
  });

/* Attach socketIO to server */
const io = require('socket.io')(socket);

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 250 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

/* Router Sequences */
const server = require('./routes/server.js');
const indexRouter = require('./routes/index.js');
const findUserRouter = require('./routes/findUser.js')
const portfolioRouter = require('./routes/portfolioData.js');
const mypageRouter = require('./routes/mypage.js');
const errorRouter = require('./routes/error.js');

/* View Engine Setup to PUG */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Router Set */
app.use('/', indexRouter);
app.use('/', findUserRouter)
app.use('/', portfolioRouter);
app.use('/', mypageRouter);
app.use('/', errorRouter); // Error Page Router
app.use('/', server); // Telegram Bot Router

/* Morgan Logger Setting */
app.use(morgan('dev'));
let accessLogStream = rfs.createStream('access.log', {
  size: "20M",
  path: path.join('../')
})
app.use(morgan(':remote-addr - :remote-user [:date[iso]] ":method :url" :status :res[content-length] :referrer', {
  stream: accessLogStream
}));

/* Database Model Settings */
const User = require('./lib/models/userModel');
const Repo = require('./lib/models/repoModel');
const Counter = require('./lib/models/counterModel');
const ChatRoom = require('./lib/models/chatRoomsModel');
const Chat = require('./lib/models/chattingModel');
const errorMessageLog = require('./lib/models/errorMessageLogsModel')

/* Report Error Function */
/* Related with ErrorHandler Function */
function reportError(err, req, res, next) {
  let timeData = moment().tz("Asia/Seoul").format('YYYY-MM-DD HH:mm:ss');
  let errorMessage = err.message;
  let errorFrom = req.url;
  let errorStatus = 500;
  let accessIpaddress = req.connection.remoteAddress.split(`:`).pop();
  let coreMessage = `ERROR TIME : ${timeData}%0AERROR MESSAGE : ${errorMessage}%0A
  ERROR FROM : ${req.url}%0A
  ERROR SENDER : ${accessIpaddress}%0A
  ERROR STATUS : ${errorStatus}`;

  /* Save to MongoDB errorMEssageLog collection */
  errorMessageLog.create({
    timeData,
    errorMessage,
    errorFrom,
    errorStatus,
    accessIpaddress,
  })

  /* Request telegram API to send message to Admin */
  request(`https://api.telegram.org/${process.env.TELEGRAM_KEY}/sendmessage?chat_id=550566016&text=${coreMessage}`)
  res.render('customError', { // Render Custom Error
    errorStatus: errorStatus,
    errorMessage: errorMessage,
    errorFrom: errorFrom
  });
}

/* Socket IO Functions */
io.on('connection', (socket) => {

  /* Join & Leave previous room Socket */
  socket.on('JoinRoom', data => {
    socket.leave(`${data.leave}`)
    socket.join(`${data.joinedRoomName}`);
    Chat.updateMany({ // When clicks the target room, target's Notice alarm will set to 0
      'chatReceiver': data.receiver,
      'roomName': data.joinedRoomName,
      'chatNotice': 1
    }, {
      $set: {
        'chatNotice': 0
      }
    }, (err) => {
      if (err) throw err;
    })
  })

  /* Message Socket */
  socket.on('say', function (data) {
    io.in(`${data.joinedRoomName}`).emit('mySaying', data); //chat message to the others
    /* Save chat into MongoDB */
    Chat.create({
      'roomName': data.joinedRoomName,
      'chatSender': data.userId,
      'chatReceiver': data.receiver,
      'chatMessage': data.msg,
      'chatNotice': 1
    })
  });

  /* Someone is typing... Socket */
  socket.on('typing', function (others) {
    let whoIsTyping = [];
    if (!whoIsTyping.includes(others)) {
      whoIsTyping.push(others);
      socket.to(`${others.joinedRoomName}`).emit('typing', whoIsTyping);
    }
  });

  /* Notice counter Socket */
  socket.on('counter', function (data) {
    Chat.aggregate([{
        $match: {
          chatReceiver: data.userId,
          chatNotice: 1
        }
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: '$chatNotice'
          }
        }
      }
    ], (err, result) => {
      if (err) throw err;
      if (Array.isArray(result) && result.length === 0) { // If Notice counter is 0, send data 0
        socket.emit('noticeAlarm', 0)
      } else {
        socket.emit('noticeAlarm', result[0].count)
      }
    })
  })

  // Quit Typing Socket
  socket.on('quitTyping', function (others) {
    let whoIsTyping = [];
    if (whoIsTyping.length == 0) {
      socket.emit('endTyping');
    } else {
      let index = whoIsTyping.indexOf(others); //if someone else is typing
      if (index != -1) {
        whoIsTyping.splice(index, 1);
        if (whoIsTyping.length == 0) {
          socket.emit('endTyping');
        }
      }
    }
  });
});

/* ErrorHandler Function */
/* Catch all errors in this function, except customError */
app.get('*', function (req, res, next) {
  let err = new Error(`${req.ip} tried to reach ${req.originalUrl}`); // Tells us which IP tried to reach a particular URL
  err.statusCode = 404;
  err.shouldRedirect = true; // New property on err so that our middleware will redirect
  next(err);
});

app.use(function (err, req, res, next) {
  // console.error(err.message);
  if (!err.statusCode) err.statusCode = 500; // Sets a generic server error status code if none is part of the err
  if (err.shouldRedirect) {
    reportError(err, req, res, next);
  } else {
    res.status(err.statusCode).send(err.message); // If shouldRedirect is not defined in our error, sends our original err data
  }
});

module.exports = app;