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

router.get("/find-users", async (req, res) => {
  let loginInformation = req.user;

  try {
    await User.find({}, 'avatar_url login bio view_counter', {
      limit: 8
    }).sort({
      created_at: -1
    }).exec(function (err, result) {
      if (err) throw err;
      // console.log(result);
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
  } catch (err) {
    throw err;
  }
});

/* Search User Router */
router.get(`/find-users/:queryString`, async function (req, res) {
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
router.get(`/find-users/moreuser/:page`, async (req, res) => {
  let pageNumber = req.params.page;
  try {
    /* Bio data Null Check & send data to client */
    function nullCheck() {
      data.forEach(results => {
        if (results.bio === null) {
          results.bio = "NO BIO";
        }
      });
      res.json(data)
    }
    /* Query 8 more data */
    let data = await User.find({}, 'avatar_url login bio view_counter').limit(8).skip(Number(pageNumber)).sort({
      "registerDate": -1
    });
    /* If no more data, send 'NODATA', If data exists execute nullCheck() function and sned data to client */
    data = data.length == 0 ?
      res.json('NODATA') :
      nullCheck();
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;