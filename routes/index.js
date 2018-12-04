const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const path = require("path");
const request = require("request");
const shortid = require("shortid");

// DB Import
const db = require("../lib/db");

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
router.get("/", function (req, res, next) {
  // Parse LinkedIn Profile Image
  let id = req.body.id;
  // Log Data
  db.query(`SELECT * FROM user group by login`, function (error, data) {
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
    // let result = JSON.parse(data);
    // let values = fieldOrder.map(k => result[k]);
    // let sql = `INSERT INTO user (${fieldOrder.join(
    //   ","
    // )}) VALUES (${fieldOrder.map(e => "?").join(",")})`;
    // db.query(sql, values);
  });

  // // User Repository Information API Process
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


      // let sqlData = `(\`${sid}\`, \`${githubid}\`, \`${name}\`, \`${githuburl}\`, \`${explanation}\`, \`${created_at}\`, \`${updated_at}\`)`;
      // console.log(sqlData);

      let sql = `INSERT INTO Personal_Data (id, githubid, name, githuburl, explanation, pjdate1, pjdate2) VALUES (${sid}, ${githubid}, ${name},${githuburl},${explanation},${created_at},${updated_at})`;
      db.query(sql);
    }
  })

  // request(repositoryOptions, function(error, response, data) {
  //   if (error) {
  //     throw error;
  //   }
  //   // repositoryResult have JSON Repos Data
  //   let repositoryResult = JSON.parse(data);

  //   let repositoryAll = [];

  //   for (i = 0; i < repositoryResult.length; i++) {
  //     // Generate Short ID to use in Personal_Data DB
  //     let sid = shortid.generate();
  //     repositoryAll.push({
  //       id: sid,
  // githubid: id,
  // name: repositoryResult[i].name,
  // githuburl: repositoryResult[i].html_url,
  // explanation: repositoryResult[i].description,
  // created_at: repositoryResult[i].created_at,
  // updated_at: repositoryResult[i].updated_at
  //     });
  //   }

  //   console.log(repositoryAll.length);
  //   let values = "";
  //   for (i = 0; i < repositoryAll.length; i++) {
  //     values +=
  //       "(" +
  //       "'" +
  //       repositoryAll[i].id +
  //       "'" +
  //       "," +
  //       "'" +
  //       repositoryAll[i].githubid +
  //       "'" +
  //       "," +
  //       "'" +
  //       repositoryAll[i].name +
  //       "'" +
  //       "," +
  //       "'" +
  //       repositoryAll[i].githuburl +
  //       "'" +
  //       "," +
  //       "'" +
  //       repositoryAll[i].explanation +
  //       "'" +
  //       "," +
  //       "'" +
  //       repositoryAll[i].created_at +
  //       "'" +
  //       "," +
  //       "'" +
  //       repositoryAll[i].updated_at +
  //       "'" +
  //       ")" +
  //       ",";
  //   }

  //   // console.log("Final Value :" + values.slice(0, -1));
  //   let sqlData = values.slice(0, -1);
  //   // console.log(sqlData);

  //   // let values = [...repositoryAll[0].join(",")];
  //   // console.log(values);
  //   let sql = `INSERT INTO Personal_Data (id, githubid, name, githuburl, explanation, pjdate1, pjdate2) VALUES ${sqlData}`;
  //   console.log(sql);
  //   db.query(sql);
  res.redirect("/");
});


// });

module.exports = router;