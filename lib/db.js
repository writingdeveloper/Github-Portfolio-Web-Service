/*
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
YOU SHOULD RENAME THIS FILE TO "db.js" AND ENTER YOUR DATABASE INFORMATION
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

ORIGINAL db.js FILE WILL NOT UPLOAD TO GITHUB REPOSITORY TO SECURITY REASONS.

*/

/* Database Module */
// const mysql = require("mysql");
// var db = mysql.createConnection({
//   host: "us-cdbr-iron-east-01.cleardb.net",
//   user: "bda535547bea30",
//   password: "8c9082ac",
//   database: "heroku_e7702c7a1d56307",
//   charset : 'utf8mb4'
// });

// db.connect();

const mysql = require("mysql");
var db = mysql.createConnection({
  host: "118.35.126.219",
  user: "sangumee",
  password: "sihung84265@",
  database: "portfolio",
  charset : 'utf8mb4'
});

db.connect();


module.exports = db;
