var fs = require("fs");
const db = require("./lib/db");

db.query(`SELECT loginId FROM user`, function (err, data) {
    if (err) {
        throw err;
    }

    const message = fs.createWriteStream(__dirname + "/sitemap.txt");
    for (let j = 0; j < data.length; j++) {
        message.write(`https://expressme.herokuapp.com/${data[j].loginId}\n`);
    }
    message.close();
})