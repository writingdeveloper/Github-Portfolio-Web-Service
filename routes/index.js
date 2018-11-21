let express = require("express");
let router = express.Router();
let bodyParser = require("body-parser");
let path = require("path");
let request = require("request");

// DB Import
let db = require("../lib/db");

// Parse DATA
const fieldOrder = [
  "login",
  "id",
  "node_id",
  "avatar_url",
  "gravatar_id",
  "url",
  "html_url",
  "followers_url",
  "following_url",
  "gists_url",
  "starred_url",
  "subscriptions_url",
  "organizations_url",
  "repos_url",
  "events_url",
  "received_events_url",
  "type",
  "site_admin",
  "name",
  "company",
  "blog",
  "location",
  "email",
  "hireable",
  "bio",
  "public_repos",
  "public_gists",
  "followers",
  "following",
  "created_at",
  "updated_at"
];

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
// Favicon Server Dependency
let favicon = require("serve-favicon");
router.use(favicon(path.join(__dirname, "../public/images", "favicon.ico")));

/* GET home page. */
router.get("/", function(req, res, next) {
  // Parse LinkedIn Profile Image
  let id = req.body.id;
  // Log Data
  db.query(`SELECT * FROM user group by login`, function(error, data) {
    //Log Error
    if (error) {
      console.log(error);
    }
    // console.log(data);
    res.render("main", {
      dataarray: data
    });
  });
});

/* POST User Save in MySQL DB */
router.post("/user", function(req, res, next) {
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
    url: githubAPI + id + "repos",
    headers: {
      "User-Agent": "request"
    }
  };

  // User Information API Process
  request(userOptions, function(error, response, data) {
    if (error) {
      throw error;
    }
    // result have JSON User Data
    let result = JSON.parse(data);
    let values = fieldOrder.map(k => result[k]);
    let sql = `INSERT INTO user (${fieldOrder.join(
      ","
    )}) VALUES (${fieldOrder.map(e => "?").join(",")})`;
    db.query(sql, values);
  });
  // User Repository Information API Process
  request(repositoryOptions, function(error, responmse, data) {
    if (error) {
      throw error;
    }
    let repositoryResult = JSON.parse(data);
  });

  res.redirect("/");
});

module.exports = router;
