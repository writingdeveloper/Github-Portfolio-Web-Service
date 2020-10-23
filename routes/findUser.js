const express = require("express");
const router = express.Router();
const {
  promisify
} = require("util");

/* Import Database Settings */
const db = require("../lib/db");
const User = require('../lib/models/userModel')

/* Login Check */
let loginCheck = req => {
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.loginId;
  }
}

router.get("/find-users", function (req, res, next) {
  let loginInformation = req.user;
  console.log(loginInformation)
  User.find({}, 'avatar_url login bio view_counter', {
    limit: 8
  }).sort({
    created_at: -1
  }).exec(function (err, result) {
    if (err) throw err;
    console.log(result);
    result.forEach(results => {
      if (results.bio === null) { // If bio is none, replace 'NO BIO' text
        results.bio = "NO BIO";
      }
    });
    res.render("find-users", {
      dataarray: result,
      loginData: loginCheck(req)
    });
  });
});

/* Search User Router */
router.get(`/find-users/:queryString`, async function (req, res, next) {
  const query = promisify(db.query).bind(db);
  let queryString = req.params.queryString;
  const data = await query(
    `SELECT distinct userId from project WHERE UPPER(keyword) LIKE UPPER("%${queryString}%")`
  );
  if (data == '' || data == []) {
    res.json('NODATA');
  } else {
    let userArray = [];
    for (let i = 0; i < data.length; i++) {
      const userData = await query(
        `SELECT * FROM user WHERE loginId='${data[i].userId}'`
      );
      if (!userData) {
        console.log("error");

      } else {
        // data NULL check
        userData.forEach(results => {
          if (results.bio === null) {
            results.bio = "NO BIO";
          }
        });
        userArray.push(userData[0]);
      }
    }
    console.log(userArray)
    res.json(userArray); // Return search data
  }
});

/* More Users Button Router */
router.get(`/find-users/moreuser/:page`, function (req, res, next) {
  db.query(
    `SELECT * FROM user ORDER BY registerDate DESC LIMIT ${req.params.page}, 8`,
    function (error, data) {
      if (error) {
        if(error) throw error;
      }
      if (data.length === 0) {
        res.json("NODATA"); // If no more data return string "NODATA" to process in client script
      } else {
        // data NULL check
        data.forEach(results => {
          if (results.bio === null) {
            results.bio = "NO BIO";
          }
        });
        res.json(data); // Return more user data
      }
    }
  );
});

module.exports = router;