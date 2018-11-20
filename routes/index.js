let express = require("express");
let router = express.Router();
let bodyParser = require("body-parser");
let path = require("path");
let request = require("request");

// DB Import
let db = require("../lib/db");

// DB Connection Check
// db.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

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
    console.log(data);

    // console.log(data);
    res.render("main", {
      dataarray: data
    });
  });
});

router.post("/user", function(req, res, next) {
  let id = req.body.id;
  let githubAPI = "https://api.github.com/users/";

  let options = {
    url: githubAPI + id,
    headers: {
      "User-Agent": "request"
    }
  };
  console.log(id);
  request(options, function(error, response, data) {
    if (error) {
      throw error;
    }
    let result = JSON.parse(data);

    let nick = result.login;
    let id = result.id;
    let node_id = result.node_id;
    let avatar_url = result.avatar_url;
    let gravatar_id = result.gravatar_id;
    let url = result.url;
    let html_url = result.html_url;
    let followers_url = result.followers_url;
    let following_url = result.following_url;
    let gists_url = result.gists_url;
    let starred_url = result.starred_url;
    let subscriptions_url = result.subscriptions_url;
    let organizations_url = result.organizations_url;
    let repos_url = result.repos_url;
    let events_url = result.events_url;
    let received_events_url = result.received_events_url;
    let type = result.type;
    let site_admin = result.site_admin;
    let name = result.name;
    let company = result.company;
    let blog = result.blog;
    let location = result.location;
    let email = result.email;
    let hireable = result.hireable;
    let bio = result.bio;
    let public_repos = result.public_repos;
    let public_gists = result.public_gists;
    let followers = result.followers;
    let following = result.following;
    let created_at = result.created_at;
    let updated_at = result.updated_at;

    if (bio == null) {
      bio = "Developer";
    }
    db.query(
      `INSERT INTO user (login, id, node_id, avatar_url, gravatar_id, url, html_url, followers_url, following_url, gists_url, starred_url, subscriptions_url, organizations_url, repos_url, events_url, received_events_url, type, site_admin, name, company, blog, location, email, hireable, bio, public_repos, public_gists, followers, following, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        nick,
        id,
        node_id,
        avatar_url,
        gravatar_id,
        url,
        html_url,
        followers_url,
        following_url,
        gists_url,
        starred_url,
        subscriptions_url,
        organizations_url,
        repos_url,
        events_url,
        received_events_url,
        type,
        site_admin,
        name,
        company,
        blog,
        location,
        email,
        hireable,
        bio,
        public_repos,
        public_gists,
        followers,
        following,
        created_at,
        updated_at
      ]
    );
  });

  res.redirect("/");
});

module.exports = router;
