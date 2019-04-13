/*
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
YOU SHOULD RENAME THIS FILE TO "db.js" AND ENTER YOUR DATABASE INFORMATION
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

ORIGINAL db.js FILE WILL NOT UPLOAD TO GITHUB REPOSITORY TO SECURITY REASONS.
*/

const mysql = require("mysql");
let db = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  port: process.env.dbPort,
  database: 'portfolio',
  charset: 'utf8mb4'
});
db.connect();
module.exports = db;

// host: process.env.host,
// user: process.env.user,
// password: process.env.password,