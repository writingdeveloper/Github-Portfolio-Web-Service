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
  console.log(req.user);
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.loginId;
  }
  console.log(`Owner Check ${ownerCheck}`);
  // console.log(userId);

  db.query(`SELECT * FROM user WHERE loginId=?`, [userId], function (error, data) {
    if (error) {
      console.log('error');
    } else {

      console.log(data[0])
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
  db.query(`SELECT * FROM project WHERE userId='${userId}'`, function (error, data) {
    if (error) {
      throw (`Error From Router /:userId/mypage \n ${error}`);
    }
    for (var i = 0; i < data.length; i++) {
      if (data[i].imageUrl === null) {
        data[i].imageUrl = '/images/app/404.png'
        console.log(`HELLO WORKS!`)
      }
    }
    data.forEach(results => {
      let date1 = results.projectDate1;
      let date2 = results.projectDate2;
      results.projectDate1 = date1;
      results.projectDate2 = date2;
    })
    // Total Counter SQL
    db.query(`SELECT SUM(counter) FROM counter WHERE userId='${userId}'`, function (error, counterSum) {
      if (error) {
        throw (`Error FROM Router /:userId/mypage \n ${error}`);
      }
      //  This Week visitor Data SQL
      db.query(`SELECT counter FROM counter WHERE userId='${userId}' AND (date=? OR date=? OR date=? OR date=? OR date=? OR date=? OR date=?)`, thisWeek, function (error, visitorData) {
        if (error) {
          throw (`Error From Router /:userId/mypage \n ${error}`);
        }
        db.query(`SELECT counter FROM counter WHERE userId='${userId}' AND date=?`, [currentDay.toISOString().split('T')[0]], function (error, todayVisitorData) {
          if (error) {
            throw (`Error From Router /:userId/mypage \n ${error}`);
          }
          if (todayVisitorData[0] === undefined) {
            console.log('NULL');
            todayVisitorData[0] = 0;
            db.query(`INSERT INTO counter (userId, date, counter) VALUES (?,?,?)`, [userId, currentDay.toISOString().split('T')[0], 0])
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
  db.query(`DELETE FROM project WHERE userId='${userId}'`); // Delete project Table
  db.query(`DELETE FROM counter WHERE userId='${userId}'`); // Delete counter Table
  db.query(`INSERT INTO counter (userId, date, counter) VALUES (?,?,?)`, [userId, currentDay.toISOString().split('T')[0], 0]); // Reset Counter SQL to use INIT
  res.json('removed');
});

/* GET Mypage Get Github Portfolio Data */
// TODO :: Needs to check the owner of the mypage and if not, avoid this job
router.get(`/:userId/admin/getData`, function (req, res, next) {
  let userId = req.params.userId;

  db.query(`SELECT registerType FROM user WHERE loginId=?`, [userId], function (error, data) {
    if (error) {
      throw (`Error from Router /:userId/admin/getData Router \n ${error}`)
    }
    console.log(data[0].registerType);
    if (data[0].registerType === 'Google') {
      res.json('Type:Google')
    } else {
      // User Repository API Option Set
      console.log('GITHUB PROCESS');
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
          let userId = result[i].owner.login;
          let projectName = result[i].name;
          let projectDemoUrl = result[i].homepage;
          let githubUrl = result[i].html_url;
          let summary = result[i].description;
          let projectDate1 = result[i].created_at;
          let projectDate2 = result[i].updated_at;
          let sqlData = [sid, userId, projectName, projectDemoUrl, githubUrl, summary, projectDate1.split('T')[0], projectDate2.split('T')[0]];
          console.log(sqlData);
          let sql = `INSERT INTO project (sid, userId , projectName, projectDemoUrl, githubUrl, summary, projectDate1, projectDate2) VALUES (?,?,?,?,?,?,?,?)`;
          db.query(sql, sqlData);
        }
        db.query(`SELECT * FROM project WHERE userId='${userId}'`, function (error, redrawData) {
          if (error) {
            throw (`Error From Router /:userId/mypage \n ${error}`);
          }
          for (var i = 0; i < redrawData.length; i++) {
            if (redrawData[i].imageUrl === null) {
              redrawData[i].imageUrl = '/images/app/404.png'
            }
          }
          redrawData.forEach(results => {
            let date1 = results.projectDate1.split('T')[0];
            let date2 = results.projectDate2.split('T')[0];
            results.projectDate1 = date1;
            results.projectDate2 = date2;
          })
          res.json(redrawData);
        })
      })
    }
  })
})

/* GET Mypage User Setting Page */
router.get(`/:userId/admin/user`, function (req, res, next) {
  let userId = req.params.userId;
  db.query(`SELECT * FROM user WHERE loginId='${userId}'`, function (error, data) {
    if (error) {
      throw (`Error From ${userId}/admin/user Router ${error}`);
    }
    let results = data[0];
    let uniqueId = `${results.userId}-${results.registerTime}`;
    res.render('mypage/user', {
      userId: userId,
      uniqueId: uniqueId,
      avatarUrl: results.avatarUrl,
      name: results.name,
      bio: results.bio,
      email: results.email,
      phoneNumber: results.phoneNumber,
      registerDate: results.registerDate
    })
  })
})

/* POST Mypage User Setting Page */
router.post(`/:userId/admin/submit`, function (req, res, next) {
  let userId = req.params.userId;
  let email = req.body.email;
  let phoneNumber = req.body.phoneNumber;
  let bio = req.body.bio;
  // Update User Data SQL
  db.query(`UPDATE user SET email=?, phoneNumber=?, bio=? WHERE loginId=?`, [email, phoneNumber, bio, userId]);
  // Check Data From DB SQL
  db.query(`SELECT * FROM user WHERE loginId=?`, [userId], function (error, AjaxData) {
    if (error) {
      throw (`Error FROM /:userId/admin/user POST ROUTER : ${error}`);
    }
    res.json(AjaxData); // Return Data
  })
})

/* MyPage User Chat Room */
router.get(`/:userId/admin/contact`, function (req, res, next) {
  let userId = req.params.userId;
  let loginedId = req.user.loginId;
  let chatListImageArray = [];
  let profileImageArray = [];
  db.query(`SELECT * FROM chatRoom WHERE chatReceiver=? OR chatSender=?`, [userId, userId], function (error, room) {
    if (error) {
      throw `Error From /:userId/admin/contact ROUTER \n ERROR : ${error}`;
    }
    // db.query(`SELECT * FROM chatRoom WHERE chatReceiver=? OR chatSender=?`, [userId, userId], function (error, data) {
    //   if (error) {
    //     throw `Error From /:userId/admin/contact ROUTER \n ERROR : ${error}`;
    //   }

    // for (let i = 0; i < room.length; i++) {
    //   if (room[i].chatSender === userId) {
    //     chatListImageArray.push(room[i].chatReceiver)
    //   } else {
    //     chatListImageArray.push(room[i].chatSender)
    //   }
    // }
    // console.log(chatListImageArray); // Chat list Array
    // console.log(room)

    // for (let i = 0; i < chatListImageArray.length; i++) {
    //   db.query(`SELECT avatar_url FROM user WHERE login=?`, [chatListImageArray[i]], function (error, profileImage) {
    //     if (error) {
    //       throw error;
    //     }
    //     // console.log(profileImage)
    //     profileImageArray.push(profileImage[0].avatar_url)
    //     console.log(profileImageArray)
    //   })
    // }
    res.render('mypage/contact', {
      userId: userId,
      loginedId: loginedId,
      room: room
      // profileImage: profileImageArray
      // })
    })
  });
});

/* GET Privious Chat Data Router */
router.get(`/:userId/:joinedRoomName/admin/getPreviousChat`, function (req, res, next) {
  let userId = req.params.userId;
  let joinedRoomName = req.params.joinedRoomName;
  console.log(`PREVIOUS CHAT DATA ROOM : ${joinedRoomName}`);
  db.query(`SELECT * FROM chatData WHERE roomName=?`, [joinedRoomName], function (error, data) {
    if (error) {
      throw error;
    }
    // Recreate Date Type
    for (let i = 0; i < data.length; i++) {
      data[i].chatDate = data[i].chatDate.toLocaleString()
    }
    res.send(data);
  });
});

/* MyPage User Chat Room */
router.get(`/:userId/contact`, function (req, res, next) {
  let userId = req.params.userId;
  let loginId = req.user.loginId;
  let roomName = `${loginId}-${userId}`;
  db.query(`SELECT * FROM chatRoom WHERE roomName=?`, [roomName], function (err, roomCheck) {
    if (err) {
      throw `Error from /:userId/contact Router \n${err}`
    }
    // Checks Room Exist
    if (roomCheck[0] === undefined) {
      // Create Room
      db.query(`INSERT INTO chatRoom (roomName, chatReceiver, chatSender) VALUES (?,?,?)`, [roomName, userId, loginId])
      res.redirect(`/${loginId}/admin/contact`)
    } else {
      res.redirect(`/${loginId}/admin/contact`)
    }
  })
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
  console.log(`Owner Check ${ownerCheck}`);
  // project Table Counter SET
  db.query(`UPDATE project SET counter=counter+1 WHERE sid=?`, [pageId]);
  // User Table Total Counter SET
  console.log(userId)
  db.query(`UPDATE user SET counter=counter+1 WHERE loginId=?`, [userId]);

  db.query(`SELECT * from counter WHERE userId=? AND date=?`, [userId, date], function (error, dayDateResult) {
    if (error) {
      console.log(`Error From Router Detail Page, Counter \n ${error}`);
    }
    if (dayDateResult[0] === undefined) {
      console.log('NULL');
      db.query(`INSERT INTO counter (userId, date, counter) VALUES (?,?,?)`, [userId, date, 1])
    } else {
      console.log('Not NULL');
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