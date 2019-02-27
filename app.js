var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const db = require("./lib/db");
var app = express();

app.io = require('socket.io')();


var indexRouter = require('./routes/index');
var portfolioRouter = require('./routes/portfolioData');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', portfolioRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.io.on('connection', function (socket) {
  // Join Room
  socket.on('JoinRoom', function (data) {
    socket.leave(`${data.leave}`)
    console.log(`Leave ROOM : ${data.leave}`)
    socket.join(`${data.joinedRoomName}`);
    console.log(`NEW JOIN IN ${data.joinedRoomName}`)
  })

  // Send Message
  socket.on('say', function (data) {
    console.log(`${data.userId} : ${data.msg}`);
    //chat message to the others
    app.io.sockets.to(`${data.joinedRoomName}`).emit('mySaying', data);
    console.log(`Message Send to : ${data.joinedRoomName}`)
    // console.log(`Message Content : ${data.userId} : ${data.message}`);
    db.query(`INSERT INTO chatData (roomName, chatSender, chatMessage) VALUES (?,?,?)`, [data.joinedRoomName, data.userId, data.msg])
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
          console.log('emit endTyping');
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


console.log('Now It Works Fine in Port 3000');

module.exports = app;