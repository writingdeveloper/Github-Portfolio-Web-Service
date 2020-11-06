/*
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
YOU SHOULD RENAME THIS FILE TO "db.js" AND ENTER YOUR DATABASE INFORMATION
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

ORIGINAL db.js FILE WILL NOT UPLOAD TO GITHUB REPOSITORY TO SECURITY REASONS.

YOU NEED TO USE ENVIRONMENT VARS TO HIDE PERSONAL INFORMATION.
CREATE .env FILE AND USE IT.

CHECK THIS DOCUMENT `https://medium.com/chingu/an-introduction-to-environment-variables-and-how-to-use-them-f602f66d15fa`
   
*/
const MONGO_URI = ''  // FOR TEST PURPOSE ONLY!!!! DO NOT UPLOAD TO GITHUB REPO

/* Database Module */
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI || MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('DB Connected');  // Connect Success
});

module.exports = db;