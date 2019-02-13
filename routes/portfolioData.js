const express = require('express');
const router = express.Router();
const path = require("path");
const shortid = require("shortid");
const bodyParser = require("body-parser");
router.use(bodyParser.json());
const db = require("../lib/db");
const aws = require('aws-sdk')
const multer = require("multer"); // multer모듈 적용 (for 파일업로드)
const multerS3 = require('multer-s3');
router.use(express.static(path.join(__dirname, "public")));

// Parsing Dependency
let cheerio = require("cheerio");
let request = require("request");


aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
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
      for (let i = 0; i < data.length; i++) {
        if (data[i].imgurl === null) {
          data[i].imgurl = `/images/app/${data[i].type}.png`;
        } else {
          data[i].imgurl = data[i].imgurl
        }
      }
      res.render("portfolioItems", {
        dataarray: data,
        userId: userId,
        ownerCheck: ownerCheck
      });
    });
});

/* GET MyPage Page */
router.get(`/:userId/admin/mypage`, function (req, res, next) {
  let userId = req.params.userId; // UserID Variable
  let updatedTime = new Date(); // updated Time Variable
  let currentDay = new Date();
  let theYear = currentDay.getFullYear();
  let theMonth = currentDay.getMonth();
  let theDate = currentDay.getDate();
  let thisWeek = [];
  for (let i = 0; i < 7; i++) {
    let resultDay = new Date(theYear, theMonth, theDate - i);
    let yyyy = resultDay.getFullYear();
    let mm = Number(resultDay.getMonth()) + 1;
    let dd = resultDay.getDate();
    mm = String(mm).length === 1 ? '0' + mm : mm;
    dd = String(dd).length === 1 ? '0' + dd : dd;
    thisWeek[i] = yyyy + '-' + mm + '-' + dd;
  }
  // Chart Data SQL
  db.query(`SELECT * FROM Personal_Data WHERE githubid='${userId}'`, function (error, data) {
    if (error) {
      throw (`Error From Router /:userId/mypage \n ${error}`);
    }
    for (var i = 0; i < data.length; i++) {
      if (data[i].imgurl === null) {
        data[i].imgurl = '/images/app/404.png'
      }
    }
    data.forEach(results => {
      let date1 = results.pjdate1.toISOString().split('T')[0];
      let date2 = results.pjdate2.toISOString().split('T')[0];
      results.pjdate1 = date1;
      results.pjdate2 = date2;
    })
    // Total Counter SQL
    db.query(`SELECT SUM(counter) FROM counter WHERE login='${userId}'`, function (error, counterSum) {
      if (error) {
        throw (`Error FROM Router /:userId/mypage \n ${error}`);
      }
      //  This Week visitor Data SQL
      db.query(`SELECT counter FROM counter WHERE login='${userId}' AND (date=? OR date=? OR date=? OR date=? OR date=? OR date=? OR date=?)`, thisWeek, function (error, visitorData) {
        if (error) {
          throw (`Error From Router /:userId/mypage \n ${error}`);
        }
        db.query(`SELECT counter FROM counter WHERE login='${userId}' AND date=?`, [currentDay.toISOString().split('T')[0]], function (error, todayVisitorData) {
          if (error) {
            throw (`Error From Router /:userId/mypage \n ${error}`);
          }
          if (todayVisitorData[0] === undefined) {
            console.log('NULL');
            todayVisitorData[0] = 0;
            db.query(`INSERT INTO counter (login, date, counter) VALUES (?,?,?)`, [userId, currentDay.toISOString().split('T')[0], 0])
          }
          console.log(todayVisitorData);
          let chartData = [];
          if (visitorData.length < 7) { // If visitor data's length is lower than 7, Push Data 0 to create Array
            for (let i = 0; i < 7 - visitorData.length; i++) {
              chartData.push(0);
            }
          }
          for (let i = 0; i < visitorData.length; i++) { // Create Counter Array for chart data
            chartData.push(visitorData[i].counter)
            console.log(chartData);
          }
          res.render('mypage/main', {
            userId: userId,
            dataArray: data,
            todayVisitor: todayVisitorData[0].counter,
            visitorData: chartData,
            chartMaxData: Math.max.apply(null, chartData), // Use in Chart Max line
            totalViews: counterSum[0]['SUM(counter)'],
            updatedTime: updatedTime.toLocaleString()
          })
        })
      })
    })
  })
})

/* GET Mypage Remove Portfolio Data */
// TODO :: Needs to check the owner of the mypage and if not, avoid this job
router.get(`/:userId/admin/removeData`, function (req, res, next) {
  let userId = req.params.userId;
  let currentDay = new Date();
  db.query(`DELETE FROM Personal_Data WHERE githubid='${userId}'`); // Delete Personal_Data Table
  db.query(`DELETE FROM counter WHERE login='${userId}'`); // Delete counter Table
  db.query(`INSERT INTO counter (login, date, counter) VALUES (?,?,?)`, [userId, currentDay.toISOString().split('T')[0], 0]); // Reset Counter SQL to use INIT
  res.json('removed');
});

/* GET Mypage Get Github Portfolio Data */
// TODO :: Needs to check the owner of the mypage and if not, avoid this job
router.get(`/:userId/admin/getData`, function (req, res, next) {
  let userId = req.params.userId;
  // User Repository API Option Set
  let repositoryOptions = {
    url: `https://api.github.com/users/${userId}/repos`,
    headers: {
      "User-Agent": "request"
    }
  }
  // User Repository Information API Process
  request(repositoryOptions, function (error, response, data) {
    if (error) {
      throw error;
    }
    let result = JSON.parse(data);
    for (i = 0; i < result.length; i++) {
      // console.log(result[i]);
      let sid = shortid.generate();
      let githubid = result[i].owner.login;
      let name = result[i].name;
      let demoUrl = result[i].homepage;
      let githuburl = result[i].html_url;
      let explanation = result[i].description;
      let created_at = result[i].created_at;
      let updated_at = result[i].updated_at;
      let sqlData = [sid, githubid, name, demoUrl, githuburl, explanation, created_at.split('T')[0], updated_at.split('T')[0]];
      console.log(sqlData);
      let sql = `INSERT INTO Personal_Data (id, githubid, name, url, githuburl, explanation, pjdate1, pjdate2) VALUES (?,?,?,?,?,?,?,?)`;
      db.query(sql, sqlData);
    }
    db.query(`SELECT * FROM Personal_Data WHERE githubid='${userId}'`, function (error, redrawData) {
      if (error) {
        throw (`Error From Router /:userId/mypage \n ${error}`);
      }
      for (var i = 0; i < redrawData.length; i++) {
        if (redrawData[i].imgurl === null) {
          redrawData[i].imgurl = '/images/app/404.png'
        }
      }
      redrawData.forEach(results => {
        let date1 = results.pjdate1.toISOString().split('T')[0];
        let date2 = results.pjdate2.toISOString().split('T')[0];
        results.pjdate1 = date1;
        results.pjdate2 = date2;
      })
      res.json(redrawData);
    })
  })
})

/* GET Mypage User Setting Page */
router.get(`/:userId/admin/user`, function (req, res, next) {
  let userId = req.params.userId;
  db.query(`SELECT * FROM user WHERE login='${userId}'`, function (error, data) {
    if (error) {
      throw (`Error From ${userId}/admin/user Router ${error}`);
    }
    let results = data[0];
    let githubUnique = `${results.id}-Github`;
    res.render('mypage/user', {
      userId: userId,
      uniqueId: githubUnique,
      avatarUrl: results.avatar_url,
      name: results.name,
      bio: results.bio,
      email: results.email,
      phoneNumber: results.phoneNumber,
      registerTime: results.register_time
    })
  })
})

/* POST Mypage User Setting Page */
router.post(`/:userId/admin/submit`, function (req, res, next) {
  let userId = req.params.userId;
  let email = req.body.email;
  let phoneNumber = req.body.phoneNumber;
  let bio = req.body.bio;
  console.log(JSON.stringify(req.body));
  db.query(`UPDATE user SET email=?, phoneNumber=?, bio=? WHERE login=?`, [email, phoneNumber, bio, userId]);
  db.query(`SELECT * FROM user WHERE login=?`, [userId], function (error, AjaxData) {
    if (error) {
      throw (`Error FROM /:userId/admin/user POST ROUTER : ${error}`);
    }
    console.log(AjaxData)
    // return res.send(JSON.stringify(AjaxData));

  })
  res.send(req.body);
})

/* GET Create Page */
router.get(`/:userId/create`, function (req, res, next) {
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
  db.query(`DELETE FROM Personal_Data WHERE id=${pageId}`, function (
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
    let results = data[0];
    // Image NULL Check
    if (results.imgurl === null) {
      imageNullCheck = `/images/app/${results.type}.png` // If image data not exists, return default tpye image
    } else {
      imageNullCheck = results.imgurl; // Image file Exists
    }
    res.render("update", {
      userId: userId,
      pageId: pageId,
      name: results.name,
      type: results.type,
      url: results.url,
      explanation: results.explanation,
      imgurl: imageNullCheck,
      startDate: results.pjdate1.substring(0, 7),
      endDate: results.pjdate2.substring(0, 7),
      githuburl: results.githuburl,
      sumlang: results.sumlang
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
  console.log(date);
  let ownerCheck;
  let imageNullCheck;
  // Owner Check
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.login;
  }
  console.log(`Owner Check ${ownerCheck}`);
  // Personal_Data Table Counter SET
  db.query(`UPDATE Personal_Data SET counter=counter+1 WHERE id=?`, [pageId]);
  // User Table Total Counter SET
  db.query(`UPDATE user SET counter=counter+1 WHERE login=?`, [userId]);

  db.query(`SELECT * from counter WHERE login=? AND date=?`, [userId, date], function (error, dayDateResult) {
    if (error) {
      console.log(`Error From Router Detail Page, Counter \n ${error}`);
    }
    if (dayDateResult[0] === undefined) {
      console.log('NULL');
      db.query(`INSERT INTO counter (login, date, counter) VALUES (?,?,?)`, [userId, date, 1])
    } else {
      console.log('Not NULL');
      // Counter Table Day Counter SET
      db.query(`UPDATE counter SET counter = counter+1 WHERE login=?`, [userId]);
    }
  })
  // GET Data from Personal Data
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
      if (results.imgurl === null) {
        console.log('NO IMAGE');
        imageNullCheck = `/images/app/${results.type}.png`
        console.log(imageNullCheck);
      } else {
        imageNullCheck = results.imgurl;
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
        db.query(`SELECT * FROM user WHERE login=?`, [userId], function (error, data) {
          if (error) {
            throw (`Error from Detail Router GET USER DATA SQL ${error}`)
          }
          let userResults = data[0];
          let email = userResults.email;
          let phoneNumber = userResults.phoneNumber;
          res.render("detail", {
            userId: userId,
            pageId: pageId,
            name: results.name,
            imgurl: imageNullCheck,
            type: results.type,
            sumlang: results.sumlang,
            startDate: results.pjdate1.toISOString().split('T')[0],
            endDate: results.pjdate2.toISOString().split('T')[0],
            explanation: results.explanation,
            url: results.url,
            githuburl: results.githuburl,
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