const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const path = require("path");
const request = require("request");
const shortid = require("shortid");
let session = require('express-session')
let FileStore = require('session-file-store')(session)

router.use(session({
  secret: process.env.session_secret || 'Hello World',
  resave: false,
  saveUninitialized: true,
  store: new FileStore(),
  cookie: {
    secure: false,
    // maxAge: new Date(Date.now() + 3600000)
    maxAge: 24000 * 60 * 60
  },
  key: 'connect.sid'
}));

// Favicon Server Dependency
let favicon = require("serve-favicon");
router.use(favicon(path.join(__dirname, "../public/images", "favicon.ico")));

// DB Import
const db = require("../lib/db");
const passport = require('../lib/passport')(router, db, request, shortid);

/* Github Auth Router */
router.get('/auth/github',
  passport.authenticate('github'));
/* Github Auth Callback Router */
router.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    // console.log('SUCESS!!' ,req);
    res.redirect(`/${req.user.username}`);
  });

/* Google Auth Router */
router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect(`/${req.user.displayName}`);
  });

/* Login Page Router */
router.get(`/auth/login`, function (req, res, next) {
  res.render("login", {});
});

/* Logout Router */
router.get(`/logout`, function (req, res, next) {
  req.logout();
  req.session.save(function (err) {
    res.redirect(`/`);
  });
});

/* BodyParser Setting */
router.use(bodyParser.json()); // to support JSON-encoded bodies
router.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
  })
);

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log('/', req.user);
  // Parse LinkedIn Profile Image
  let id = req.body.id;
  // Main page Profile Data Process
  db.query(`SELECT * FROM user ORDER BY registerDate DESC LIMIT 5`, function (error, data) { // GET Data sort with register_time and get 6 Profile
    // Log Error
    if (error) {
      console.log(error);
    }
    let url = ''
    if (req.user) {
      url = req.user.login
    } else {
      url = '';
    }
    // Main Page BIO NULL Check
    data.forEach(results => {
      console.log(results.bio);
      if (results.bio === null) {
        results.bio = 'NO BIO';
      }
    })
    res.render("main", {
      dataarray: data,
      _user: req.user,
      url: url
    });
  });
});

/* POST User Save in MySQL DB */
router.post("/user", function (req, res, next) {
  // id value is from PUG form
  let id = req.body.id;
  let githubAPI = "https://api.github.com/users/";
  // User Information API Option Set
  let userOptions = {
    url: githubAPI + id,
    headers: {
      "User-Agent": "request"
    }
  };
  // User Repository API Option Set
  let repositoryOptions = {
    url: githubAPI + id + "/repos",
    headers: {
      "User-Agent": "request"
    }
  };
  // User Information API Process
  request(userOptions, function (error, response, data) {
    if (error) {
      throw (`Error from index.js User Information API Process ${error}`);
    }
    // result have JSON User Data
    let result = JSON.parse(data);
    console.log(result);
    if (result.name === null) {
      result.name = result.login;
    }
    db.query(`INSERT INTO user (loginId, displayId, avatarUrl, name, bio, registerType) VALUES (?,?,?,?,?,'Gtihub')`, [result.login, result.id, result.avatar_url, result.name, result.bio]); // User Information INSERT SQL
  });

  // User Repository Information API Process
  request(repositoryOptions, function (error, response, data) {
    if (error) {
      throw (`Error from index.js User Repository Information API Process ${error}`);
    }
    let result = JSON.parse(data);
    for (i = 0; i < result.length; i++) {
      let sid = shortid.generate();
      let userId = result[i].owner.login;
      let projectName = result[i].name;
      let githubUrl = result[i].html_url;
      let summary = result[i].description;
      let projectDate1 = result[i].created_at;
      let projectDate2 = result[i].updated_at;
      let sqlData = [sid, userId, projectName, githubUrl, summary, projectDate1, projectDate2];
      console.log(sqlData);
      let sql = `INSERT INTO project (sid, userId, projectName, githubUrl, summary, projectDate1, projectDate2) VALUES (?,?,?,?,?,?,?)`;
      db.query(sql, sqlData);
    }
  });
  res.redirect("/");
});

module.exports = router;