const express = require('express');
const router = express.Router();
const path = require("path");
const shortid = require("shortid");
const bodyParser = require("body-parser");
const db = require("../lib/db");

const aws = require('aws-sdk')
const multer = require("multer"); // multer모듈 적용 (for 파일업로드)
const multerS3 = require('multer-s3');
router.use(express.static(path.join(__dirname, "public")));


// Parsing Dependency
let cheerio = require("cheerio");
let request = require("request");




router.use(bodyParser.json());
aws.config.update({
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  accessKeyId: AWS_ACCESS_KEY_ID,
  region: 'ap-northeast-2'
});

let s3 = new aws.S3();


let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'portfolioworld',
    key: function (req, file, cb) {
      let newFileName = Date.now() + "-" + file.originalname;
      let fullPath = `public/images/member/${req.params.userId}/${newFileName}`;
      console.log(file);
      cb(null, fullPath); //use Date.now() for unique file keys
    }
  })
});


/* GET home page. */
router.get(`/:userId`, function (req, res, next) {
  let userId = req.params.userId;

  // Check Owner of this page
  let ownerCheck;
  console.log(req.user);
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.login;
  }
  console.log(`Owner Check ${ownerCheck}`);

  // console.log(userId);
  db.query(
    `SELECT * FROM Personal_Data WHERE githubid='${userId}' ORDER BY pjdate2 DESC`,
    function (error, data) {
      if (error) {
        throw error;
      }
      res.render("portfolioItems", {
        dataarray: data,
        userId: userId,
        ownerCheck: ownerCheck
      });
    });
});

/* GET Create Page */
router.get("/:userId/create", function (req, res, next) {
  let userId = req.params.userId;
  res.render("create", {
    // Sample Image
    userId: userId,
    imgurl: "https://via.placeholder.com/730x444?text=Portfolio Image will be display here!"
  });
});

/* POST Create_Process Page */
router.post("/:userId/create_process", upload.single("projectImg"), function (
  req,
  res,
  next
) {
  console.log('This' + req.file.location);

  let userId = req.params.userId;
  let sid = shortid.generate();
  let githubid = req.params.userId;
  let name = req.body.projectName;
  let type = req.body.portType;
  let url = req.body.projectUrl;
  let explanation = req.body.projectExplanation;
  // files information are in req.file object
  // Check Image Process
  let imgurl = req.file.location;
  let sumlang = req.body.sumLang;
  let pjdate1 = req.body.pjdate1;
  let pjdate2 = req.body.pjdate2;
  let githuburl = req.body.githuburl;

  db.query(
    "INSERT INTO Personal_Data (id, githubid, name, type, url, explanation, imgurl, sumlang, pjdate1, pjdate2, githuburl) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    [
      sid,
      githubid,
      name,
      type,
      url,
      explanation,
      imgurl,
      sumlang,
      pjdate1,
      pjdate2,
      githuburl
    ]
  );
  res.redirect("/" + userId);
});

/* Delete Process */
router.post("/:userId/:pageId/delete_process", function (req, res, next) {
  // GET userId
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  console.log(userId + " and " + pageId);

  db.query(`SELECT imgurl FROM Personal_Data WHERE id='${pageId}'`, function (error, data) {
    if (error) {
      console.log(`Error Message From UPDATE: ${error}`);
    } else {
      console.log(data);
      let params = {
        Bucket: 'portfolioworld',
        Key: data[0].imgurl.substr(55)
      };
      console.log(data[0].imgurl.substr(55));
      s3.deleteObject(params, function (error, data) {
        if (error) {
          console.log(`Error Message From UPDATE : ${error}`);
        } else {
          console.log(`Delete Previous Image complete`);
        }
      })
    }
  });


  db.query(`DELETE FROM Personal_Data WHERE id=?`, [pageId], function (
    error,
    data
  ) {
    if (error) {
      throw error;
    }
    console.log(data);
  });

  /* TODO :: ERROR IN userID*/
  res.redirect("/" + userId);
});

/* GET Update Page */
router.get("/:userId/:pageId/update", function (req, res) {
  let userId = req.params.userId;
  let pageId = req.params.pageId;

  db.query(`SELECT * FROM Personal_Data WHERE id=?`, [pageId], function (
    error,
    data
  ) {
    if (error) {
      throw error;
    }

    console.log(data);
    res.render("update", {
      userId: userId,
      pageId: pageId,
      name: data[0].name,
      type: data[0].type,
      url: data[0].url,
      explanation: data[0].explanation,
      imgurl: data[0].imgurl,
      startDate: data[0].pjdate1,
      endDate: data[0].pjdate2,
      githuburl: data[0].githuburl,
      sumlang: data[0].sumlang
    });
  });
});

/* POST Update Page */
router.post(
  "/:userId/:pageId/update_process",
  upload.single("projectImg"),
  function (req, res) {
    let userId = req.params.userId;
    let pageId = req.params.pageId;
    db.query(`SELECT imgurl FROM Personal_Data WHERE id=?`, [pageId], function (
      error,
      data
    ) {
      if (error) {
        throw error;
      }
      console.log(data[0]);

      let name = req.body.projectName;
      let type = req.body.portType;
      let url = req.body.projectUrl;
      let explanation = req.body.projectExplanation;

      let imgurl = req.file ? req.file.location : undefined;
      let sumlang = req.body.sumLang;
      let pjdate1 = req.body.pjdate1;
      let pjdate2 = req.body.pjdate2;
      let githuburl = req.body.githuburl;
      console.log(`IMGURL ${imgurl}`)

      // If Imgurl is undefined
      if (imgurl === undefined) {
        db.query(
          `UPDATE Personal_Data SET name=?, type=?, url=?, explanation=?, sumlang=?, pjdate1=?, pjdate2=?, githuburl=? WHERE id=?`,
          [
            name,
            type,
            url,
            explanation,
            sumlang,
            pjdate1,
            pjdate2,
            githuburl,
            pageId
          ]
        );
        // If Imgurl is exist
      } else {
        db.query(`SELECT imgurl FROM Personal_Data WHERE id='${pageId}'`, function (error, data) {
          if (error) {
            console.log(`Error Message From UPDATE: ${error}`);
          } else {
            console.log(data);
            if (data[0].imgurl === null) {
              console.log('NO PREVIOUS IMAGE DATA');
            } else {
              let params = {
                Bucket: 'portfolioworld',
                Key: data[0].imgurl.substr(55)
              };
              s3.deleteObject(params, function (error, data) {
                if (error) {
                  console.log(`Error Message From UPDATE : ${error}`);
                } else {
                  console.log(`Delete Previous Image complete`);
                }
              })
            }
          }
        });
        db.query(
          `UPDATE Personal_Data SET name=?, type=?, url=?, explanation=?, imgurl=?, sumlang=?, pjdate1=?, pjdate2=?, githuburl=? WHERE id=?`,
          [
            name,
            type,
            url,
            explanation,
            imgurl,
            sumlang,
            pjdate1,
            pjdate2,
            githuburl,
            pageId
          ]
        );
      }
    });
    res.redirect("/" + userId + "/" + pageId);
  }
);

/* GET Detail View Page */
router.get("/:userId/:pageId", function (req, res, next) {
  // GET URL params and put it into :pageId
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  let ownerCheck;

  // Owner Check
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.login;
  }
  console.log(`Owner Check ${ownerCheck}`);

  // GET data id to use Object
  db.query(`SELECT * FROM Personal_Data WHERE id=?`, [pageId], function (
    error,
    data
  ) {
    if (error) {
      throw error;
    }
    // If wrong request from Client (Tried Not Exist Portfolio Page), Redirect user page
    if (data[0] === undefined) {
      res.redirect(`/${userId}`);
    } else {
      let results = data[0];
      // Get github URL
      let url = results.githuburl;
      console.log(url);

      // Use Request Module to parsing Web page
      request(url, function (error, response, html) {
        let readme;
        // If Error with parsing Github README.md
        if (error) {
          console.log("Have Some problem with Reading Github README.md file!");
          console.log(error);
          readme =
            "<div>This Page has no Github README.md or if there are Error Check the server Console</div>";
          console.log(readme + "ERROR");
        } else {
          // Parsing readme ID in github page
          let $ = cheerio.load(html);
          $(".Box-body").each(function () {
            // save to readme Variable
            readme = $(this).html().replace(/<img src="\//gi, `<img src="https://github.com/`);
            // console.log(readme);
          });
        }
        // Rendering
        console.log("No Problem with Detail Pages data");


        res.render("detail", {
          userId: userId,
          pageId: pageId,
          name: results.name,
          imgurl: results.imgurl,
          type: results.type,
          sumlang: results.sumlang,
          startDate: results.pjdate1,
          endDate: results.pjdate2,
          explanation: results.explanation,
          url: results.url,
          githuburl: results.githuburl,
          markdown: readme,
          ownerCheck: ownerCheck
        });
      });
    }
  });
});


module.exports = router;