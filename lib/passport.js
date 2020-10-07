module.exports = function (router) {
  const passport = require('passport')
  const request = require('request');
  const GitHubStrategy = require('passport-github').Strategy;

  /* Import Database Settings */
  let User = require('../lib/models/userModel');
  let Repo = require('../lib/models/repoModel');
  let LoginLogs = require('../lib/models/loginLogsModel');

  // const githubCredentials = require('../config/github.json'); // Development Setting
  /* Github OAuth Strategy */
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_PRODUCTION_CLIENT_ID,
      clientSecret: process.env.GITHUB_PRODUCTION_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_PRODUCTION_CALLBACK_URL
    },
    function (accessToken, refreshToken, profile, done) {
      // console.log(profile);

      User.find({
        'id': profile.id,
      }, function (err, registerData) {
        if (err) throw err;
        if (registerData.length > 0) { // When if registered member
          /* Log login logs */
          LoginLogs.create({
            login: profile.username,
            id: profile.id,
            node_id: profile._json.node_id,
            provider: profile.provider,
            profileURL: profile.profileUrl,
            name: profile.displayName,
            location: profile.location,
            email: profile.email
          }, function (err, log) {
            if (err) return handleError(err);
          })
          return done(null, profile);
        } else {

          /* API Request URL */
          let requestURL = `https://api.github.com/users/${profile.username}`
          let userAPIURL = {
            headers: {
              'User-Agent': 'request',
              'accept': 'application/vnd.github.VERSION.raw',
              'Authorization': `token ${process.env.GITHUB_DATA_ACCESS_TOKEN}`,
              'charset': 'UTF-8'
            },
            json: true,
            url: requestURL
          };
          /* User Data Import */
          request(userAPIURL, function (err, res, userData) {
            if (err) throw err;
            userData.registerType = 'registered'
            User.create(userData, function (err, res) {
              if (err) throw err;
            })
          })
          /* Repo Data Import */
          userAPIURL.url = `${requestURL}/repos?per_page=100`
          request(userAPIURL, function (err, res, repoData) {
            if (err) throw err;
            if (!repoData.length == 0 || repoData.fork == false) {
              Repo.insertMany(repoData, function (err, result) {
                  if (err) throw err;
              })
          }
          })
        }
      })
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