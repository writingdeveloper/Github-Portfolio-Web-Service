require('dotenv').config()
const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const request = require("request");
const moment = require('moment-timezone');
const morgan = require('morgan');
const rfs = require('rotating-file-stream')
const rateLimit = require("express-rate-limit");
const app = express();
/*
If the environment variable fails to load, run the node app with `node -r dotenv/config. /bin/www`
*/

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

/* Socket IO */
app.io = require('socket.io')();

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

/* Logger Setting */
app.use(morgan('dev'));
let accessLogStream = rfs.createStream('access.log', {
  size: "10M",
  path: path.join('../')
})
/* Logger Format */
app.use(morgan(':remote-addr - :remote-user [:date[iso]] ":method :url" :status :res[content-length] :referrer', {
  stream: accessLogStream
}));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Router Set */
app.use('/telegram', server); // Telegram Bot Router
app.use('/', indexRouter);
app.use('/', findUserRouter)
app.use('/', mypageRouter);
app.use('/', portfolioRouter);
app.use('/reportError', errorRouter); // Error Page Router

/* catch 404 and forward to error handler */
app.use(function (req, res, next) {
  next(createError(404));
});

/* Database Setting */
const errorMessageLog = require('./lib/models/errorMessageLogsModel')

/* Error Handler */
app.use(async function (err, req, res) {
  try {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    const telegramKey = process.env.TELEGRAM_KEY;
    let SenderIPAdress = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(`:`).pop();
    let errorMessage = err;
    let userAgent = req.get('User-Agent');
    let errorURL = req.header('Referer')
    let timeData = moment().tz("Asia/Seoul").format('YYYY-MM-DD HH:mm:ss');

    await errorMessageLog.create({
      SenderIPAdress,
      errorMessage,
      userAgent,
      errorURL,
      timeData
    }, (err, result) => {
      if (err) throw err;
    })
    let coreMessage =
      `ERROR TIME : ${timeData}%0A
   ERROR MESSAGE : ${errorMessage}%0A
   ERROR FROM : ${errorURL}%0A
   ERROR SENDER : ${SenderIPAdress}`;
    /* Report to Admin */
    request(`https://api.telegram.org/${telegramKey}/sendmessage?chat_id=550566016&text=${coreMessage}`)
  } catch (e) {
    throw e;
  }
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


/*-----------------------------------------------------------------------*/

/* Socket IO Functions */
app.io.on('connection', function (socket) {
  // Join Room Scoket
  socket.on('JoinRoom', function (data) {
    socket.leave(`${data.leave}`)
    // console.log(`Leave ROOM : ${data.leave}`)
    socket.join(`${data.joinedRoomName}`);
    // console.log(`NEW JOIN IN ${data.joinedRoomName}`)
    // console.log(`RECEIVER : ${data.receiver}`)
    // When Reads the message SET notice to '1'
    db.query(`UPDATE chatData SET notice='1' WHERE chatReceiver=? AND roomName=?`, [data.receiver, data.joinedRoomName])
  })

  // Send Message Socket
  socket.on('say', function (data) {
    // console.log(`${data.userId} : ${data.msg}`);
    //chat message to the others
    app.io.sockets.to(`${data.joinedRoomName}`).emit('mySaying', data);
    // console.log(`Message Send to : ${data.joinedRoomName}`)
    // console.log(`Message Content : ${data.userId} : ${data.message}`);
    // Chat Message Save to DB SQL
    db.query(`INSERT INTO chatData (roomName, chatSender, chatReceiver, chatMessage) VALUES (?,?,?,?)`, [data.joinedRoomName, data.userId, data.receiver, data.msg])
  });

  // Typing... Socket Function
  socket.on('typing', function (others) {
    let whoIsTyping = [];
    if (!whoIsTyping.includes(others)) {
      whoIsTyping.push(others);
      // console.log('who is typing now');
      // console.log(whoIsTyping);
      app.io.sockets.to(`${others.joinedRoomName}`).emit('typing', whoIsTyping);
    }
  });

  // Notice Counter Socket
  // socket.on('counter', function (data) {
  //   let counterTo = data.userId;
  //   socket.join(`${data.userId}`)
  //   // console.log(`COUNTER ${data.userId} ON!`)
  //   db.query(`SELECT COUNT(notice) FROM chatData WHERE chatReceiver=? AND notice='0'`, [data.userId], function (error, data) {
  //     if (error) {
  //       throw error;
  //     }
  //     let count = data[0]['COUNT(notice)'];
  //     // console.log(data[0]['COUNT(notice)']);
  //     // console.log(COUNT(notice));
  //     app.io.sockets.to(`${counterTo}`).emit('noticeAlarm', count)
  //     // console.log(`SEND NOTICE TO ${counterTo} NUM : ${count}`)
  //   })
  // })

  // Quit Typing Socket
  socket.on('quitTyping', function (others) {
    let whoIsTyping = [];
    if (whoIsTyping.length == 0) {
      //if it's empty
      // console.log('emit endTyping');
      app.io.emit('endTyping');
    } else {
      //if someone else is typing
      var index = whoIsTyping.indexOf(others);
      // console.log(index);
      if (index != -1) {
        whoIsTyping.splice(index, 1);
        if (whoIsTyping.length == 0) {
          // console.log('emit endTyping');
          app.io.emit('endTyping');
        } else {
          app.io.emit('typing', whoIsTyping);
          // console.log('emit quitTyping');
          // console.log('whoIsTyping after quit');
          // console.log(whoIsTyping);
        }
      }
    }
  });
});

console.log(`Now It Works Fine in Port ${process.env.PORT}`);
module.exports = app;