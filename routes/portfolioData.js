const express = require('express');
const path = require("path");
const shortid = require("shortid");
const bodyParser = require("body-parser");
const db = require("../lib/db");
const aws = require('aws-sdk')
const multer = require("multer"); // multer모듈 적용 (for 파일업로드)
const multerS3 = require('multer-s3');
const router = express.Router();

router.use(bodyParser.json());
router.use(express.static(path.join(__dirname, "public")));

// Parsing Dependency
const cheerio = require("cheerio");
const request = require("request");

/* Amazon Webservice S3 Storage Settings */
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'ap-northeast-2'
});
let s3 = new aws.S3();
let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'portfolioworld',
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
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.loginId;
  }
  // console.log(userId);

  db.query(`SELECT * FROM user WHERE loginId=?`, [userId], function (error, data) {
    if (error) {
      console.log('error');
    } else {
      if (data[0] === undefined) {
        res.render('customError', {
          userId: userId, // Entered User ID
          loginedId: ownerCheck, // Logined User ID
          error: 'USER MISSING',
          description: 'Report Please'
        })
      } else {
        db.query(
          `SELECT * FROM project WHERE userId='${userId}' ORDER BY projectDate2 DESC`,
          function (error, data) {
            if (error) {
              throw error;
            }
            for (let i = 0; i < data.length; i++) {
              if (data[i].imageUrl === null) {
                data[i].imageUrl = `/images/app/${data[i].type}.png`;
              } else {
                data[i].imageUrl = data[i].imageUrl
              }
            }
            res.render("portfolioItems", {
              dataarray: data,
              userId: userId,
              ownerCheck: ownerCheck
            });
          });
      }
    }
  });
});


/* GET Create Page */
router.get(`/:userId/create`, function (req, res, next) {
  let userId = req.params.userId;
  res.render("create", {
    // Sample Image
    userId: userId,
    imageUrl: "https://via.placeholder.com/730x444?text=Portfolio Image will be display here!"
  });
});

/* POST Create_Process Page */
router.post("/:userId/create_process", upload.single("imageUrl"), function (
  req,
  res,
  next
) {
  console.log('This' + req.file.location);

  let sid = shortid.generate();
  let userId = req.params.userId;
  let projectName = req.body.projectName;
  let type = req.body.type;
  let projectDemoUrl = req.body.projectDemoUrl;
  let summary = req.body.summary;
  // files information are in req.file object
  // Check Image Process
  let imageUrl = req.file.location;
  let keyword = req.body.keyword;
  let projectDate1 = req.body.projectDate1;
  let projectDate2 = req.body.projectDate2;
  let githubUrl = req.body.githubUrl;

  db.query(
    "INSERT INTO project (sid, userId, projectName, type, projectDemoUrl, summary, imageUrl, keyword, projectDate1, projectDate2, githubUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    [
      sid,
      userId,
      projectName,
      type,
      projectDemoUrl,
      summary,
      imageUrl,
      keyword,
      projectDate1,
      projectDate2,
      githubUrl
    ]
  );
  res.redirect(`/${userId}`);
});

/* Delete Process */
router.post("/:userId/:pageId/delete_process", function (req, res, next) {
  // GET userId
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  console.log(userId + " and " + pageId);
  db.query(`SELECT imageUrl FROM project WHERE sid='${pageId}'`, function (error, data) {
    if (error) {
      console.log(`Error Message From UPDATE: ${error}`);
    } else {
      console.log(data);
      let params = {
        Bucket: 'portfolioworld',
        Key: data[0].imageUrl.substr(55)
      };
      console.log(data[0].imageUrl.substr(55));
      s3.deleteObject(params, function (error, data) {
        if (error) {
          console.log(`Error Message From UPDATE : ${error}`);
        } else {
          console.log(`Delete Previous Image complete`);
        }
      })
    }
  });
  db.query(`DELETE FROM project WHERE sid='${pageId}'`, function (
    error,
    data
  ) {
    if (error) {
      throw error;
    }
    console.log(data);
  });
  /* TODO :: ERROR IN userID*/
  res.redirect(`/${userId}`);
});

/* GET Update Page */
router.get("/:userId/:pageId/update", function (req, res) {
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  db.query(`SELECT * FROM project WHERE sid=?`, [pageId], function (
    error,
    data
  ) {
    if (error) {
      throw error;
    }
    let results = data[0];
    // Image NULL Check
    if (results.imageUrl === null) {
      imageNullCheck = `/images/app/${results.type}.png` // If image data not exists, return default tpye image
    } else {
      imageNullCheck = results.imageUrl; // Image file Exists
    }
    res.render("update", {
      userId: userId,
      pageId: pageId,
      projectName: results.projectName,
      type: results.type,
      projectDemoUrl: results.projectDemoUrl,
      summary: results.summary,
      imageUrl: imageNullCheck,
      projectDate1: results.projectDate1.substr(0, 7),
      projectDate2: results.projectDate2.substr(0, 7),
      githubUrl: results.githubUrl,
      keyword: results.keyword
    });
  });
});

/* POST Update Page */
router.post(
  "/:userId/:pageId/update_process",
  upload.single("imageUrl"),
  function (req, res) {
    let userId = req.params.userId;
    let pageId = req.params.pageId;
    db.query(`SELECT imageUrl FROM project WHERE sid=?`, [pageId], function (
      error,
      data
    ) {
      if (error) {
        throw error;
      }
      console.log(data[0]);
      let projectName = req.body.projectName;
      let type = req.body.type;
      let projectDemoUrl = req.body.projectDemoUrl;
      let summary = req.body.summary;
      let imageUrl = req.file ? req.file.location : undefined;
      let keyword = req.body.keyword;
      let projectDate1 = req.body.projectDate1;
      let projectDate2 = req.body.projectDate2;
      let githubUrl = req.body.githubUrl;
      // If imageUrl is undefined
      if (imageUrl === undefined) {
        db.query(
          `UPDATE project SET projectName=?, type=?, projectDemoUrl=?, summary=?, keyword=?, projectDate1=?, projectDate2=?, githubUrl=? WHERE sid=?`,
          [
            projectName,
            type,
            projectDemoUrl,
            summary,
            keyword,
            projectDate1,
            projectDate2,
            githubUrl,
            pageId
          ]
        );
        // If imageUrl is exist
      } else {
        db.query(`SELECT imageUrl FROM project WHERE sid='${pageId}'`, function (error, data) {
          if (error) {
            console.log(`Error Message From UPDATE: ${error}`);
          } else {
            console.log(data);
            if (data[0].imageUrl === null) {
              console.log('NO PREVIOUS IMAGE DATA');
            } else {
              let params = {
                Bucket: 'portfolioworld',
                Key: data[0].imageUrl.substr(55)
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
          `UPDATE project SET projectName=?, type=?, projectDemoUrl=?, summary=?, imageUrl=?, keyword=?, projectDate1=?, projectDate2=?, githubUrl=? WHERE sid=?`,
          [
            projectName,
            type,
            projectDemoUrl,
            summary,
            imageUrl,
            keyword,
            projectDate1,
            projectDate2,
            githubUrl,
            pageId
          ]
        );
      }
    });
    res.redirect(`/${userId}/${pageId}`);
  }
);

/* GET Detail View Page */
router.get("/:userId/:pageId", function (req, res, next) {
  // GET URL params and put it into :pageId
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  // let date = new Date().toISOString().substr(0, 10).replace('T', ' '); // Today Date
  let date = new Date();
  let dd = date.getDate();
  let mm = date.getMonth() + 1; //January is 0!
  let yyyy = date.getFullYear();
  if (dd < 10) {
    dd = '0' + dd
  }
  if (mm < 10) {
    mm = '0' + mm
  }
  date = `${yyyy}-${mm}-${dd}`;
  let ownerCheck;
  let imageNullCheck;
  // Owner Check
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.loginId;
  }
  // project Table Counter SET
  db.query(`UPDATE project SET counter=counter+1 WHERE sid=?`, [pageId]);
  // User Table Total Counter SET
  db.query(`UPDATE user SET counter=counter+1 WHERE loginId=?`, [userId]);
  db.query(`SELECT * from counter WHERE userId=? AND date=?`, [userId, date], function (error, dayDateResult) {
    if (error) {
      console.log(`Error From Router Detail Page, Counter \n ${error}`);
    }
    if (dayDateResult[0] === undefined) {
      db.query(`INSERT INTO counter (userId, date, counter) VALUES (?,?,?)`, [userId, date, 1])
    } else {
      // Counter Table Day Counter SET
      db.query(`UPDATE counter SET counter = counter+1 WHERE userId=?`, [userId]);
    }
  })
  // GET Data from Personal Data
  db.query(`SELECT * FROM project WHERE sid=?`, [pageId], function (
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
      let url = results.githubUrl;
      if (results.imageUrl === null) {
        console.log('NO IMAGE');
        imageNullCheck = `/images/app/${results.type}.png`
        console.log(imageNullCheck);
      } else {
        imageNullCheck = results.imageUrl;
      }
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
        if (readme === undefined) { // If readme is undefined
          readme = '<div>This Page has no Github README.md or if there are Error Check the server Console</div>'
        }
        db.query(`SELECT * FROM user WHERE loginId=?`, [userId], function (error, data) {
          if (error) {
            throw (`Error from Detail Router GET USER DATA SQL ${error}`)
          }
          let userResults = data[0];
          let email = userResults.email;
          let phoneNumber = userResults.phoneNumber;
          console.log(results.pjdate1);
          // console.log(results.pjdate1.toISOString().substr(0,7));
          res.render("detail", {
            userId: userId,
            pageId: pageId,
            projectName: results.projectName,
            imageUrl: imageNullCheck,
            type: results.type,
            keyword: results.keyword,
            projectDate1: results.projectDate1,
            projectDate2: results.projectDate2,
            summary: results.summary,
            projectDemoUrl: results.projectDemoUrl,
            githubUrl: results.githubUrl,
            counter: results.counter,
            markdown: readme,
            email: email,
            phoneNumber: phoneNumber,
            ownerCheck: ownerCheck
          });
        });
      })
    }
  });
});

module.exports = router;