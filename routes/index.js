const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const path = require("path");
const request = require("request");
let session = require("express-session");
let FileStore = require("session-file-store")(session);

/* Redirect http to https */
router.get("*", function (req, res, next) {
  if (
    req.headers["x-forwarded-proto"] != "https" &&
    process.env.NODE_ENV === "production"
  )
    res.redirect(`https://"${req.hostname}${req.url}`);
  else next(); /* Continue to other routes if we're not redirecting */
});

/* Session Settings */
router.use(
  session({
    secret: process.env.session_secret,
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
    cookie: {
      secure: false,
      maxAge: 24000 * 60 * 60
    },
    key: "connect.sid"
  })
);

// Favicon Server Dependency
let favicon = require("serve-favicon");
router.use(favicon(path.join(__dirname, "../public/images", "favicon.ico")));

/* Import Database Settings */
const db = require("../lib/db");
let User = require('../lib/models/userModel');
let LoginLogs = require('../lib/models/loginLogsModel');
/* Import Authentication Setting (Passport.js) */
const passport = require("../lib/passport")(router, db, request);

/* Github Auth Router */
router.get("/auth/github", passport.authenticate("github"));

const authenticateUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(301).redirect('/auth/login');
  }
};

/* Github Auth Callback Router */
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/auth/login",
    successRedirect: '/'
  }));

/* Login Page Router */
router.get(`/auth/login`, function (req, res, next) {
  res.render("login", {});
});

/* Logout Router */
router.get(`/logout`, function (req, res, next) {
  req.logout();
  req.session.save(function (err) {
    if (err) throw err;
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

/* SiteMap */
router.get(`/sitemap/0`, function (req, res, next) {
  let pageNumber = (Number(req.params.page) * 10000); // Current Page Number
  let nextPage = (Number(req.params.page) + 1) * 10000; // Next Page Number
  let pageResult; // Page Result

  /* Sitemap Query */
  User.find()
    .sort({
      'id': 1
    })
    .limit(10000)
    .then(userData => {
      res.render("sitemap", {
        userData,
        // pageNumber,
        // pageResult
      })
    })
});

// User.find().limit(Number(nextPage))
// if (pageData.length === 0) { // If no more data in next Page
//   pageResult = 'NODATA'
// } else {
//   pageResult = (Number(req.params.page) + 1) // More Data Exists return next page URL
// }




// db.query(
//   `SELECT * FROM user order by displayId*1 LIMIT ?, 10000`,
//   [Number(pageNumber)],
//   function (error, data) {
//     if (error) {
//       throw error;
//     }
//     // console.log(data);
//     db.query(`SELECT * FROM user order by displayId*1 LIMIT ?, 10000`, [Number(nextPage)], function (error, pageData) {
//       if (error) {
//         throw error;
//       }
//       if (pageData.length === 0) { // If no more data in next Page
//         pageResult = 'NODATA'
//       } else {
//         pageResult = (Number(req.params.page) + 1) // More Data Exists return next page URL
//       }
//       res.render("sitemap", {
//         dataarray: data,
//         pageNumber,
//         pageResult
//       })
//     });
// }
// );

/* Main Router */
router.get("/", function (req, res, next) {

  let ownerCheck;
  if (req.user == undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.username;
  }
  User.find({}, 'login bio avatar_url', { // Main profile db query
    limit: 5
  }).sort({
    created_at: -1
  }).exec(function (err, result) {
    if (err) console.log(err);
    result.forEach(results => {
      if (results.bio === null) { // If bio is none, replace 'NO BIO' text
        results.bio = "NO BIO";
      }
    });
    res.render('main', {
      dataarray: result,
      _user: req.user,
      url: ownerCheck
    })
  })
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
      throw `Error from index.js User Information API Process ${error}`;
    }
    // result have JSON User Data
    let result = JSON.parse(data);
    console.log(result);
    if (result.name === null) {
      result.name = result.login;
    }
    db.query(
      `INSERT INTO user (loginId, displayId, avatarUrl, name, bio, registerType) VALUES (?,?,?,?,?,'Gtihub')`,
      [result.login, result.id, result.avatar_url, result.name, result.bio]
    ); // User Information INSERT SQL
  });

  // User Repository Information API Process
  request(repositoryOptions, function (error, response, data) {
    if (error) {
      throw `Error from index.js User Repository Information API Process ${error}`;
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
      let sqlData = [
        sid,
        userId,
        projectName,
        githubUrl,
        summary,
        projectDate1,
        projectDate2
      ];
      console.log(sqlData);
      let sql = `INSERT INTO project (sid, userId, projectName, githubUrl, summary, projectDate1, projectDate2) VALUES (?,?,?,?,?,?,?)`;
      db.query(sql, sqlData);
    }
  });
  res.redirect("/");
});

/* Get newly Data */
router.get(`/getAllData`, function (req, res, next) {
  // Main page Profile Data Process
  db.query(`SELECT * FROM project WHERE keyword IS NULL`, function (
    error,
    data
  ) {
    // GET Data sort with register_time and get 6 Profile
    // Log Error
    if (error) {
      console.log(error);
    }

    function timer(ms) {
      return new Promise(res => setTimeout(res, ms));
    }
    async function load() {
      // We need to wrap the loop into an async function for this to work
      for (let i = 0; i < data.length; i++) {
        let getDataOption = {
          url: `https://api.github.com/repos/${data[i].userId}/${data[i].projectName}/languages`,
          headers: {
            "User-Agent": "request"
          }
        };
        request(getDataOption, function (err, res, body) {
          console.log(body);
          if (err) {
            console.log(err);
          }
          db.query(
            `UPDATE project SET keyword='${body}' WHERE userId='${data[i].userId}' AND projectName='${data[i].projectName}'`
          );
        });
        await timer(3000); // then the created Promise can be awaited
      }
    }
    load();
    res.end();
  });
});

module.exports = router;