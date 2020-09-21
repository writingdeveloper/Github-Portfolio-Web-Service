module.exports = function (router, request, shortid) {
  const passport = require('passport')
  const GitHubStrategy = require('passport-github').Strategy;
  /* Import Database Settings */
  let User = require('../lib/models/userModel');

  // const githubCredentials = require('../config/github.json'); // Development Setting
  /* Github OAuth Strategy */
  passport.use(new GitHubStrategy({
      clientID: process.env.githubProductionClientID,
      clientSecret: process.env.githubProductionClientSecret,
      callbackURL: process.env.githubProductionCallbackURL
    },
    function (accessToken, refreshToken, profile, done) {
      // console.log(accessToken);
      console.log(profile);

      // User.find({
      //     id: profile.id
      //   }, 'id login')
      //   .exec(function (err, result) {
      //     if (err) console.log(err);
      //     console.log(result);
      //   })
      // Check Register
      // db.query(`SELECT * FROM user WHERE displayId=?`, [profile.id], function (error, data) {
      //     if (error) {
      //         throw error;
      //     }
      //     // console.log(profile);
      //     // console.log(data);
      //     if (data.length > 0) {
      //         console.log('registered Member!!');
      //     } else {
      //         if (profile.displayName === null) { // If displayName is NULL, use profile.username
      //             profile.displayName = profile.username;
      //         }
      //         db.query(`INSERT INTO user (loginId, displayId, avatarUrl, name, bio, registerType) VALUES (?, ?, ?, ?, ?, ?)`, [profile.username, profile.id, profile._json.avatar_url, profile.displayName, profile._json.bio, 'Github']); // User Insert Query
      //         // GET Github Data
      //         let githubAPI = "https://api.github.com/users/";
      //         // User Information API Option Set
      //         let userOptions = {
      //             url: githubAPI + profile.username,
      //             headers: {
      //                 "User-Agent": "request"
      //             }
      //         };
      //         // User Repository API Option Set
      //         let repositoryOptions = {
      //             url: githubAPI + profile.username + "/repos",
      //             headers: {
      //                 "User-Agent": "request"
      //             }
      //         };
      //         // User Repository Information API Process
      //         request(repositoryOptions, function (error, response, data) {
      //             if (error) {
      //                 throw error;
      //             }
      //             let result = JSON.parse(data);
      //             for (i = 0; i < result.length; i++) {
      //                 // console.log(result[i]);
      //                 let sid = shortid.generate();
      //                 let userId = result[i].owner.login;
      //                 let projectName = result[i].name;
      //                 let projectUrl = result[i].html_url;
      //                 let summary = result[i].description;
      //                 let projectDate1 = result[i].created_at;
      //                 let projectDate2 = result[i].updated_at;
      //                 let sqlData = [sid, userId, projectName, projectUrl, summary, projectDate1, projectDate2];
      //                 console.log(sqlData);
      //                 let sql = `INSERT INTO project (sid, userId, projectName, projectUrl, summary, projectDate1, projectDate2) VALUES (?,?,?,?,?,?,?)`; // PUT All Data to DB
      //                 db.query(sql, sqlData);
      //             }
      //         })
      //     }
      // })
      return done(null, profile);
    }
  ));

  router.use(passport.initialize());
  router.use(passport.session());

  passport.serializeUser(function (profile, done) {
    done(null, profile);
  });

  passport.deserializeUser(function (req, profile, done) {
    req.session.sid = profile.username;
    console.log(`Session User Check : ${req.session.sid}`);
    done(null, profile);
  });

  return passport;
}