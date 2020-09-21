const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const db = require("../lib/db");
const router = express.Router();

router.use(bodyParser.json());
router.use(express.static(path.join(__dirname, "public")));

/* Anonymous Error Report */
router.post(`/er/anonymous`, function (req, res, next) {
    let sender = req.body.sender;
    let userAgent = req.body.userAgent;
    let vendor = req.body.vendor;
    let language = req.body.language;
    let errorMessage = 'No User Error'
    let errorFrom = req.header('Referer');
    db.query(`INSERT INTO error (sender, userAgent, vendor, language, errorMessage, errorFrom) VALUES (?,?,?,?,?,?)`, [sender, userAgent, vendor, language, errorMessage, errorFrom])
    res.redirect('/');
});

/* Logined User Error Report */
router.post(`/er/:userId`, function (req, res, next) {
    let sender = req.body.sender;
    let userAgent = req.body.userAgent;
    let vendor = req.body.vendor;
    let language = req.body.language;
    let errorMessage = 'No User Error'
    let errorFrom = req.header('Referer');
    db.query(`INSERT INTO error (sender, userAgent, vendor, language, errorMessage, errorFrom) VALUES (?,?,?,?,?,?)`, [sender, userAgent, vendor, language, errorMessage, errorFrom])
    res.redirect('/');
});

module.exports = router;