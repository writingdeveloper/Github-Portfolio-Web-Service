const db = require("./lib/db");
const request = require("request");
const shortid = require("shortid");

let userId;

function timer(ms) {
    return new Promise(res => setTimeout(res, ms));
}
async function load() {
    // We need to wrap the loop into an async function for this to work
    for (let i = 365; i < 500; i++) {
        await timer(10000);
        let getDataOption = {
            url: `https://api.github.com/users?since=${i}?client_id=4759e5875ec96b1011ee&client_secret=fca441b57aaa2774ec1cc353721f8ee51a9094b8&per_page=1`,
            headers: {
                "User-Agent": "request"
            }
        };
        console.log(getDataOption.url);
        request(getDataOption, function (err, res, profile) {
            // console.log(JSON.parse(profile));
            let data = JSON.parse(profile);
            console.log(data[0].login);
            if (userId === data[0].login) {
                console.log(`Same User in ${i}`);
            } else {
                console.log(`Different User in ${i}`);
                userId = data[0].login;
                if (err) {
                    console.log(err);
                }
                // if (profile.displayName === null) { // If displayName is NULL, use profile.username
                //     profile.displayName = profile.username;
                // }
                db.query(
                    `INSERT INTO user (loginId, displayId, avatarUrl, name, bio, registerType) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        data[0].login,
                        data[0].id,
                        data[0].avatar_url,
                        data[0].login,
                        "Developer",
                        "Unregistered"
                    ]
                ); // User Insert Query

                // await timer(3000); // then the created Promise can be awaited
                let githubAPI = "https://api.github.com/users/";
                let repositoryOptions = {
                    url: githubAPI +
                        userId +
                        "/repos?client_id=4759e5875ec96b1011ee&client_secret=fca441b57aaa2774ec1cc353721f8ee51a9094b8",
                    headers: {
                        "User-Agent": "request"
                    }
                };


                request(repositoryOptions, function (error, response, data) {
                    if (error) {
                        throw error;
                    }
                    let result = JSON.parse(data);
                    // console.log(result);
                    for (i = 0; i < result.length; i++) {
                        // console.log(result[i]);
                        let sid = shortid.generate();
                        let userId = result[i].owner.login;
                        let projectName = result[i].name;
                        let githubUrl = result[i].html_url;
                        let summary = result[i].description;
                        let keyword = `{"language" : "${result[i].language}"}`;
                        let langData = JSON.parse(keyword);
                        let projectDate1 = result[i].created_at;
                        let projectDate2 = result[i].updated_at;
                        let sqlData = [
                            sid,
                            userId,
                            projectName,
                            githubUrl,
                            summary,
                            keyword,
                            projectDate1,
                            projectDate2
                        ];
                        // console.log(sqlData);
                        let sql = `INSERT INTO project (sid, userId, projectName, githubUrl, summary, keyword, projectDate1, projectDate2) VALUES (?,?,?,?,?,?,?,?)`; // PUT All Data to DB
                        db.query(sql, sqlData);
                    }
                });
            }
        });
    }
    // await timer(1000);
    await timer(3000);
}
load();