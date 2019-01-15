const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const path = require("path");
const request = require("request");
const shortid = require("shortid");
let session = require('express-session')
let FileStore = require('session-file-store')(session)

router.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: new FileStore()
}));

// Favicon Server Dependency
let favicon = require("serve-favicon");
router.use(favicon(path.join(__dirname, "../public/images", "favicon.ico")));

let passport = require('passport');
// DB Import
const db = require("../lib/db");

// Parse DATA
const fieldOrder = [
  "login",
  "id",
  "avatar_url",
  "name",
  "bio"
];

let GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
    clientID: '36eebe46884c9debc1f4',
    clientSecret: '73085d60a186fc60446bd49276968f1c3f0dc251',
    callbackURL: "https://expressme.herokuapp.com/auth/github/callback/"
  },
  function (accessToken, refreshToken, profile, cb) {
    console.log(accessToken);
    // console.log(profile);
    // Check Register
    db.query(`SELECT 0 FROM user WHERE id=?`, [profile.id], function (error, data) {
      if (error) {
        throw error;
      }
      // console.log(profile);
      // console.log(data);
      if (data.length > 0) {
        console.log('registered Member!!');
      } else {
        db.query(`INSERT INTO user (login, id, avatar_url, name, bio) VALUES (?, ?, ?, ?, ?)`, [profile.username, profile.id, profile._json.avatar_url, profile._json.name, profile._json.bio]);

        // Data
        let githubAPI = "https://api.github.com/users/";
        // User Information API Option Set
        let userOptions = {
          url: githubAPI + profile.username,
          headers: {
            "User-Agent": "request"
          }
        };
        // User Repository API Option Set
        let repositoryOptions = {
          url: githubAPI + profile.username + "/repos",
          headers: {
            "User-Agent": "request"
          }
        };
        // User Repository Information API Process
        request(repositoryOptions, function (error, response, data) {
          if (error) {
            throw error;
          }
          let result = JSON.parse(data);

          for (i = 0; i < result.length; i++) {
            // console.log(result[i]);
            let sid = shortid.generate();
            let githubid = result[i].owner.login;
            let name = result[i].name;
            let githuburl = result[i].html_url;
            let explanation = result[i].description;
            let created_at = result[i].created_at;
            let updated_at = result[i].updated_at;
            let sqlData = [sid, githubid, name, githuburl, explanation, created_at, updated_at];
            console.log(sqlData);
            let sql = `INSERT INTO Personal_Data (id, githubid, name, githuburl, explanation, pjdate1, pjdate2) VALUES (?,?,?,?,?,?,?)`;
            db.query(sql, sqlData);
          }
        })
      }
    })
    return cb(null, profile);
  }
));

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
  console.log('serializeUser', user.id);
});

passport.deserializeUser(function (obj, cb) {
  db.query(`SELECT * FROM user WHERE id=?`, [obj], function (error, data) {
    if (error) {
      throw error;
    }
    cb(null, data[0]);
    console.log('DeserializerUser', data[0]);
  })
});

// Auth Router
router.get('/auth/github',
  passport.authenticate('github'));

router.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    // console.log('SUCESS!!' ,req);
    res.redirect(`/${req.user.username}`);
  });

router.get(`/auth/login`, function (req, res, next) {
  res.render("login", {});
});

router.get(`/logout`, function (req, res, next) {
  req.logout();
  req.session.save(function (err) {
    res.redirect(`/`);
  });
});


// Routes to portFolioData.js
let portfolioDataRouter = require("./portfolioData");
router.use("/", portfolioDataRouter);

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
  db.query(`SELECT * FROM user ORDER BY register_time DESC LIMIT 5`, function (error, data) { // GET Data sort with register_time and get 6 Profile
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
    // console.log(data);
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
      throw error;
    }
    // result have JSON User Data
    let result = JSON.parse(data);
    console.log(result);
    if (result.bio === null) {
      result.bio = '';
    }
    let values = fieldOrder.map(k => result[k]);
    let sql = `INSERT INTO user (${fieldOrder.join(
      ","
    )}) VALUES (${fieldOrder.map(e => "?").join(",")})`;
    db.query(sql, values);
  });

  // User Repository Information API Process
  request(repositoryOptions, function (error, response, data) {
    if (error) {
      throw error;
    }
    let result = JSON.parse(data);

    for (i = 0; i < result.length; i++) {
      // console.log(result[i]);

      let sid = shortid.generate();
      let githubid = result[i].owner.login;
      let name = result[i].name;
      let githuburl = result[i].html_url;
      let explanation = result[i].description;
      let created_at = result[i].created_at;
      let updated_at = result[i].updated_at;
      let sqlData = [sid, githubid, name, githuburl, explanation, created_at, updated_at];

      console.log(sqlData);

      let sql = `INSERT INTO Personal_Data (id, githubid, name, githuburl, explanation, pjdate1, pjdate2) VALUES (?,?,?,?,?,?,?)`;
      db.query(sql, sqlData);
    }
  });
  res.redirect("/");
});

module.exports = router;