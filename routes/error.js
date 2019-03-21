const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const db = require("../lib/db");
const router = express.Router();

router.use(bodyParser.json());
router.use(express.static(path.join(__dirname, "public")));

/* Anonymous Error Report */
router.post(`/reportError/er/anonymous`, function (req, res, next) {
    let sender = req.body.sender;
    let userAgent = req.body.userAgent;
    let vendor = req.body.vendor;
    let language = req.body.language;
    let errorMessage = 'No User Error'
    console.log(sender);
    db.query(`INSERT INTO error (sender, userAgent, vendor, language, errorMessage) VALUES (?,?,?,?,?)`, [sender, userAgent, vendor, language, errorMessage])
    res.redirect('/');
});

/* Logined User Error Report */
router.post(`/reportError/er/:userId`, function (req, res, next) {
    let sender = req.body.sender;
    let userAgent = req.body.userAgent;
    let vendor = req.body.vendor;
    let language = req.body.language;
    let errorMessage = 'No User Error'
    console.log(`HELP!!! ${sender} : ${userAgent}`);
    db.query(`INSERT INTO error (sender, userAgent, vendor, language, errorMessage) VALUES (?,?,?,?,?)`, [sender, userAgent, vendor, language, errorMessage])
    res.redirect('/');
});

module.exports = router;