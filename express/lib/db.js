/*
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
YOU SHOULD RENAME THIS FILE TO "db.js" AND ENTER YOUR DATABASE INFORMATION
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

ORIGINAL db.js FILE WILL NOT UPLOAD TO GITHUB REPOSITORY TO SECURITY REASONS.
*/

// const mysql = require("mysql");
// let db = mysql.createConnection({
//   host: '183.103.249.186',
//   user: process.env.user,
//   password: process.env.password,
//   database: 'portfolio',
//   charset: 'utf8mb4'
//   // host: process.env.host,
//   // user: process.env.user,
//   // password: process.env.password,
//   // database: 'portfolio',
//   // charset: 'utf8mb4'
// });

// db.connect();
// module.exports = db;

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('DB Connected');
});

module.exports = db;