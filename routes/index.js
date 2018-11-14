let express = require("express");
let router = express.Router();
let bodyParser = require("body-parser");
let path = require("path");

let db = require("../lib/db");

// DB Connection Check
// db.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// Routes to portFolioData.js
let portfolioDataRouter = require("./portfolioData");
router.use("/", portfolioDataRouter);

router.use(bodyParser.json()); // to support JSON-encoded bodies
router.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
  })
);
// Favicon Server Dependency
let favicon = require("serve-favicon");
router.use(favicon(path.join(__dirname, "../public/images", "favicon.ico")));

/* GET home page. */
router.get("/", function(req, res, next) {
  // Log Data
  // console.log(data);
  res.render("main", {});
});

module.exports = router;
