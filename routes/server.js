const express = require("express");
const router = express.Router();
const request = require("request");
const moment = require('moment-timezone');

const telegramKey = process.env.telegramKey;
let timeData = moment().tz("Asia/Seoul").format('YYYY-MM-DD HH:mm:ss');

router.get(`/`, function (req, res, next) {
    let coreMessage = `MySQL Data BackUP Complete : ${timeData}`;
    request(`https://api.telegram.org/${telegramKey}/sendmessage?chat_id=550566016&text=${coreMessage}`)
    console.log('Finish');
    res.end();
});

module.exports = router;