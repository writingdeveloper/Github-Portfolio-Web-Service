module.exports = function (router, db, request, shortid) {
    const passport = require('passport')
    const GitHubStrategy = require('passport-github').Strategy;
    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    /* Google OAuth Strategy */
    passport.use(new GoogleStrategy({
            clientID: process.env.googleProductionClientID,
            clientSecret: process.env.googleProductionClientSecret,
            callbackURL: process.env.googleProductionCallbackURL
        },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile);
            db.query(`SELECT 0 FROM user WHERE loginId=?`, [profile.id], function (error, data) {
                if (error) {
                    throw error;
                }
                // console.log(profile);
                // console.log(data);
                if (data.length > 0) { // Check Registered or not
                    console.log('registered Member!!');
                } else {
                    let loginId = profile.displayName;
                    let displayId = profile.id;
                    let avatarUrl = profile.photos[0].value;
                    let name = profile.displayName;
                    db.query(`INSERT INTO user (loginId, displayId, avatarUrl, name, registerType) VALUES (?, ?, ?, ?, ?)`, [loginId, displayId, avatarUrl, name, 'Google']); // MySQL user Table Query
                }
            })
            return cb(null, profile);
        }
    ));

    // const githubCredentials = require('../config/github.json'); // Development Setting
    /* Github OAuth Strategy */
    passport.use(new GitHubStrategy({
            clientID: process.env.githubProductionClientID,
            clientSecret: process.env.githubProductionClientSecret,
            callbackURL: process.env.githubProductionCallbackURL
        },
        function (accessToken, refreshToken, profile, cb) {
            // console.log(accessToken);
            console.log(profile.id);
            // Check Register
            db.query(`SELECT * FROM user WHERE displayId=?`, [profile.id], function (error, data) {
                if (error) {
                    throw error;
                }
                // console.log(profile);
                // console.log(data);
                if (data.length > 0) {
                    console.log('registered Member!!');
                } else {
                    if (profile.displayName === null) { // If displayName is NULL, use profile.username
                        profile.displayName = profile.username;
                    }
                    db.query(`INSERT INTO user (loginId, displayId, avatarUrl, name, bio, registerType) VALUES (?, ?, ?, ?, ?, ?)`, [profile.username, profile.id, profile._json.avatar_url, profile.displayName, profile._json.bio, 'Github']); // User Insert Query
                    // GET Github Data
                    let githubAPI = "https://api.github.com/users/";
                    // User Information API Option Set
                    let userOptions = {
                        url: githubAPI + profile.username,
                        headers: {
                            "User-Agent": "request"
                        }
                    };
                    // User Repository API Option Set
                    let repositoryOptions = {
                        url: githubAPI + profile.username + "/repos",
                        headers: {
                            "User-Agent": "request"
                        }
                    };
                    // User Repository Information API Process
                    request(repositoryOptions, function (error, response, data) {
                        if (error) {
                            throw error;
                        }
                        let result = JSON.parse(data);
                        for (i = 0; i < result.length; i++) {
                            // console.log(result[i]);
                            let sid = shortid.generate();
                            let userId = result[i].owner.login;
                            let projectName = result[i].name;
                            let projectUrl = result[i].html_url;
                            let summary = result[i].description;
                            let projectDate1 = result[i].created_at;
                            let projectDate2 = result[i].updated_at;
                            let sqlData = [sid, userId, projectName, projectUrl, summary, projectDate1, projectDate2];
                            console.log(sqlData);
                            let sql = `INSERT INTO project (sid, userId, projectName, projectUrl, summary, projectDate1, projectDate2) VALUES (?,?,?,?,?,?,?)`; // PUT All Data to DB
                            db.query(sql, sqlData);
                        }
                    })
                }
            })
            return cb(null, profile);
        }
    ));

    router.use(passport.initialize());
    router.use(passport.session());

    passport.serializeUser(function (user, cb) {
        cb(null, user.id);
        console.log('serializeUser', user.id);
    });

    passport.deserializeUser(function (obj, cb) {
        console.log(obj)
        db.query(`SELECT * FROM user WHERE displayId=?`, [obj], function (error, data) {
            if (error) {
                throw error;
            }
            cb(null, data[0]);
            console.log('DeserializerUser', data[0]);
        })
    });
    return passport;
}