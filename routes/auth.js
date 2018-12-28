var express = require('express');
var router = express.Router();
var passport = require('passport');

/* Auth */
let GitHubStrategy = require('passport-github').Strategy;
passport.use(new GitHubStrategy({
        clientID: '36eebe46884c9debc1f4',
        clientSecret: '73085d60a186fc60446bd49276968f1c3f0dc251',
        callbackURL: "http://127.0.0.1:3000/auth/github/user/callback"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            githubId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));
/* GET users listing. */
router.get('/auth/user/github',
  passport.authenticate('github'));

router.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
module.exports = router;
