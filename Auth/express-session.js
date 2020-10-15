var express = require("express");
var session = require("express-session");
var FileStore = require("session-file-store")(session);

var app = express();

app.use(
  session({
    // Secret Key Should not upload in any Github Repository!!
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
  })
);

app.get("/", function(req, res, next) {
  console.log(req.session);
  if (req.session.num === undefined) {
    req.session.num = 1;
  } else {
    req.session.num = req.session.num + 1;
  }
  res.send(`Views : ${req.session.num}`);
});

app.listen(3000, function() {
  console.log("Example App Listening on port 3000");
});
