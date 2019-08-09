const express = require("express");
const router = express.Router();

/* Import Database Settings */
const db = require("../lib/db");


router.get("/find-users", function (req, res, next) {

  db.query(`SELECT * FROM user ORDER BY registerDate DESC LIMIT 0, 8`, function (error, data) { // GET Data sort with register_time and get 6 Profile
    // Log Error
    if (error) {
      console.log(error);
    }
    let url = ''
    if (req.user) {
      url = req.user.loginId
    } else {
      url = '';
    }
    // Main Page BIO NULL Check
    data.forEach(results => {
      if (results.bio === null) {
        results.bio = 'NO BIO';
      }
    })
    res.render("find-users", {
      dataarray: data,
      _user: req.user,
      url: url
    })
  });
});

router.get(`/find-users/moreuser`, function (req, res, next) {
  let page = 8;
  console.log(page)
  db.query(`SELECT * FROM user ORDER BY registerDate DESC LIMIT ${page}, 8`, function (error, data) {
    console.log(data.length);
    page += 8;
    // Log Error
    if (error) {
      console.log(error);
    }
    let url = ''
    if (req.user) {
      url = req.user.loginId
    } else {
      url = '';
    }
    // Main Page BIO NULL Check
    data.forEach(results => {
      if (results.bio === null) {
        results.bio = 'NO BIO';
      }
    })
    res.json(data);
  })
})

module.exports = router;