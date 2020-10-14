require('dotenv').config()
const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const db = require("./lib/db");
const request = require("request");
const moment = require('moment-timezone');
const app = express();
/*
If the environment variable fails to load, run the node app with `node -r dotenv/config. /bin/www`
*/

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

/* Logger & Path Set */
app.use(logger('dev'));
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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

/* Error Handler */
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  let sender = req.connection.remoteAddress.split(`:`).pop();
  let errorMessage = err.message;
  let userAgent = req.get('User-Agent');
  let errorFrom = req.header('Referer');
  // Error Report SQL
  // db.query(`INSERT INTO error (sender, userAgent, vendor, language, errorMessage, errorFrom) VALUES (?,?,?,?,?,?)`, [sender, userAgent, 'SYSTEM', 'SYSTEM', errorMessage, errorFrom]);
  const telegramKey = process.env.telegramKey;
  let timeData = moment().tz("Asia/Seoul").format('YYYY-MM-DD HH:mm:ss');
  let coreMessage = `ERROR TIME : ${timeData} ERROR MESSAGE : ${errorMessage} ERROR FROM : ${errorFrom} ERROR SENDER : ${sender}`;
  request(`https://api.telegram.org/${telegramKey}/sendmessage?chat_id=550566016&text=${coreMessage}`)
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

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