const express = require("express");
const router = express.Router();
const request = require("request");
const bodyParser = require("body-parser");
const path = require("path");
const moment = require("moment");

/* Import Database Settings */
const db = require("../lib/db");
let User = require('../lib/models/userModel');
let Repo = require('../lib/models/repoModel');
let Counter = require('../lib/models/counterModel');

router.use(bodyParser.json());
router.use(express.static(path.join(__dirname, "public")));

/* Session Check Function */
let sessionCheck = (req, res, next) => {
  if ((Object.keys(req.session.passport).length === 0 && req.session.passport.constructor === Object || req.session.passport.user.username !== req.params.userId)) {
    res.render('customError', {
      errorExplain: `You cannot access this page or perform tasks. Login data and Session data mismatching`,
      errorMessage: 'Invalid Access Error',
    });
  } else if ((Object.keys(req.session.passport).length !== 0 && req.session.passport.constructor !== Object) || req.session.passport.user.username === req.params.userId) {
    next();
  }
}

/* GET MyPage Page */
router.get(`/:userId/admin/mypage`, (req, res, next) => {
  let userId = req.params.userId;
  let today = new Date().toISOString().substr(0, 10).replace('T', '')
  let userNumber;

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
  Repo.find({
    'owner.login': userId
  }, function (err, repo) {
    if (err) throw err;
    userNumber = repo[0].owner.id;

    // function isNull(obj, key) {
    //   return (obj[key] === null || obj[key] === undefined || obj[key] === "null");
    // }

    // function validate(obj) {
    //   var objKeys = Object.keys(obj);
    //   // console.log(objKeys)
    //   objKeys.forEach((key) => {
    //     if (isNull(obj, key)) {
    //       obj[key] = "";
    //     }
    //     if (typeof (obj[key]) == "object") {
    //       validate(obj[key]);
    //     }
    //   });
    // }
    // validate(repo);
    let languageNameArray = require('../config/languageNames')
    repo.map((repo) => {
      {
        let imageName = (repo.language || '').toLowerCase();
        /* If AWS Image Exists */
        if (repo.imageURL) {
          // console.log('Use AWS Image')
        } else if (languageNameArray.includes(imageName) == false) {
          repo.imageURL = `/images/app/${repo.projectType}.png`
        } else if (languageNameArray.includes(imageName) == true) {
          let lowercaseLanguage = (repo.language || '').toLowerCase().replace(/\+/g, '%2B').replace(/\#/g, "%23");
          repo.imageURL = `https://portfolioworld.s3.ap-northeast-2.amazonaws.com/devicon/${lowercaseLanguage}/${lowercaseLanguage}-original.svg`
        } else if (repo.language == null && repo.imageURL == null) {
          repo.imageURL = `/images/app/${repo.projectType}.png`
        }

        if (!repo.homepage) {
          repo.homepage = 'None'
        }
        if (!repo.language) {
          repo.language = 'None'
        }
      }
    })

    Counter.aggregate([{
        $match: {
          userName: userId,
          userNumber: userNumber
        }
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: "$count"
          }
        }
      }
    ], function (err, totalViews) {
      if (err) throw err;
      totalViews = totalViews[0].count;
    

    Counter.aggregate([{
        $match: {
          userName: userId,
          userNumber : userNumber,
          viewDate: today,
        }
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: "$count"
          }
        }
      }
    ], function (err, todayVisitor) {
      if (err) throw err;
      todayVisitor = todayVisitor[0].count;

      res.render('mypage/main', {
        userId: userId,
        dataArray: repo,
        todayVisitor: todayVisitor,
        // visitorData: chartData,
        // chartMaxData: Math.max.apply(null, chartData), // Use in Chart Max line
        totalViews: totalViews,
        updatedTime: updatedTime.toLocaleString()
      })
    })
  })
})


  // Chart Data SQL
  // db.query(`SELECT * FROM project WHERE userId='${userId}'`, function (error, data) {
  //   if (error) {
  //     throw (`Error From Router /:userId/mypage \n ${error}`);
  //   }
  //   for (var i = 0; i < data.length; i++) {
  //     if (data[i].imageUrl === null) {
  //       data[i].imageUrl = '/images/app/404.png'
  //     }
  //   }
  //   data.forEach(results => {
  //     let date1 = results.projectDate1;
  //     let date2 = results.projectDate2;
  //     results.projectDate1 = date1;
  //     results.projectDate2 = date2;
  //   })
  // Total Counter SQL
  //     db.query(`SELECT SUM(counter) FROM counter WHERE userId='${userId}'`, function (error, counterSum) {
  //       if (error) {
  //         throw (`Error FROM Router /:userId/mypage \n ${error}`);
  //       }
  //       //  This Week visitor Data SQL
  //       db.query(`SELECT counter FROM counter WHERE userId='${userId}' AND (date=? OR date=? OR date=? OR date=? OR date=? OR date=? OR date=?)`, thisWeek, function (error, visitorData) {
  //         if (error) {
  //           throw (`Error From Router /:userId/mypage \n ${error}`);
  //         }
  //         db.query(`SELECT counter FROM counter WHERE userId='${userId}' AND date=?`, [currentDay.toISOString().split('T')[0]], function (error, todayVisitorData) {
  //           if (error) {
  //             throw (`Error From Router /:userId/mypage \n ${error}`);
  //           }
  //           if (todayVisitorData[0] === undefined) {
  //             todayVisitorData[0] = 0;
  //             db.query(`INSERT INTO counter (userId, date, counter) VALUES (?,?,?)`, [userId, currentDay.toISOString().split('T')[0], 0])
  //           }
  //           let chartData = [];
  //           if (visitorData.length < 7) { // If visitor data's length is lower than 7, Push Data 0 to create Array
  //             for (let i = 0; i < 7 - visitorData.length; i++) {
  //               chartData.push(0);
  //             }
  //           }
  //           for (let i = 0; i < visitorData.length; i++) { // Create Counter Array for chart data
  //             chartData.push(visitorData[i].counter)
  //           }
  // res.render('mypage/main', {
  //   userId: userId,
  //   dataArray: data,
  //   // todayVisitor: todayVisitorData[0].counter,
  //   // visitorData: chartData,
  //   // chartMaxData: Math.max.apply(null, chartData), // Use in Chart Max line
  //   // totalViews: counterSum[0]['SUM(counter)'],
  //   updatedTime: updatedTime.toLocaleString()
  // })
  //         })
  //       })
  //     })
  //   })
})

/* GET Mypage Remove Portfolio Data */
router.get(`/:userId/admin/removeData`, sessionCheck, (req, res, next) => {
  let userId = req.params.userId;
  let sessionData = req.session.passport;
  if (sessionData.user.username === userId) {
    Repo.deleteMany({
      'owner.login': userId
    }, (err, result) => {
      if (err) {
        res.json('{fail}');
      } else {
        res.json('{success}');
      }
    })

  } else {
    sessionCheck(res, userId, sessionData);
  }
});


/* GET Mypage Get Github Portfolio Data */
// TODO :: Needs to check the owner of the mypage and if not, avoid this job
router.get(`/:userId/admin/getData`, sessionCheck, (req, res, next) => {
  let userId = req.params.userId;
  let sessionData = req.session.passport;
  if (sessionData.user.username === userId) {
    request({
      headers: {
        'User-Agent': 'request',
        'accept': 'application/vnd.github.VERSION.raw',
        'Authorization': `token ${process.env.GITHUB_DATA_ACCESS_TOKEN}`,
        'charset': 'UTF-8'
      },
      json: true,
      url: `https://api.github.com/users/${userId}/repos?per_page=100`,
    }, (error, response, data) => {
      console.log(response.statusCode)
      if (response.statusCode == 200) {
        res.json('{success}')
      } else {
        res.json('{fail}')
      }
      if (error) throw error;
      for (i in data) {
        if (data.length == 0 || data[i].fork == false) {
          Repo.insertMany(data[i], (err, result) => {
            if (err) throw err;
          })
        }
      }
    })

  } else {
    sessionCheck(res, userId, sessionData);
  }
})


// db.query(`SELECT registerType FROM user WHERE loginId=?`, [userId], function (error, data) {
//   if (error) {
//     throw (`Error from Router /:userId/admin/getData Router \n ${error}`)
//   }
//   console.log(data[0].registerType);
//   if (data[0].registerType === 'Google') {
//     res.json('Type:Google')
//   } else {
//     // User Repository API Option Set
//     console.log('GITHUB PROCESS');
//     let repositoryOptions = {
//       url: `https://api.github.com/users/${userId}/repos`,
//       headers: {
//         "User-Agent": "request"
//       }
//     }
//     // User Repository Information API Process
//     request(repositoryOptions, function (error, response, data) {
//       if (error) {
//         throw error;
//       }
//       let result = JSON.parse(data);
//       for (let i = 0; i < result.length; i++) {
//         let sid = shortid.generate();
//         let userId = result[i].owner.login;
//         let projectName = result[i].name;
//         let projectDemoUrl = result[i].homepage;
//         let githubUrl = result[i].html_url;
//         let summary = result[i].description;
//         let projectDate1 = result[i].created_at;
//         let projectDate2 = result[i].updated_at;
//         let keyword = result[i].language;
//         let sqlData = [sid, userId, projectName, projectDemoUrl, githubUrl, summary, projectDate1.split('T')[0], projectDate2.split('T')[0], keyword];
//         let sql = `INSERT INTO project (sid, userId , projectName, projectDemoUrl, githubUrl, summary, projectDate1, projectDate2, keyword) VALUES (?,?,?,?,?,?,?,?,?)`;
//         db.query(sql, sqlData);
//       }
//       db.query(`SELECT * FROM project WHERE userId='${userId}'`, function (error, redrawData) {
//         if (error) {
//           throw (`Error From Router /:userId/mypage \n ${error}`);
//         }
//         for (var i = 0; i < redrawData.length; i++) {
//           if (redrawData[i].imageUrl === null) {
//             redrawData[i].imageUrl = '/images/app/404.png'
//           }
//         }
//         redrawData.forEach(results => {
//           let date1 = results.projectDate1.split('T')[0];
//           let date2 = results.projectDate2.split('T')[0];
//           results.projectDate1 = date1;
//           results.projectDate2 = date2;
//         })
//         res.json(redrawData);
//       })
//     })
//   }
// })
// })

/* GET Mypage User Setting Page */
router.get(`/:userId/admin/user`, sessionCheck, function (req, res, next) {
  let userId = req.params.userId;
  User.find({
    'login': userId
  }, function (err, userData) {
    if (err) throw err;
    userData = userData[0];
    res.render('mypage/user', {
      userId: userData.login,
      uniqueId: `${userData._id}-${userData.id}`,
      avatarUrl: userData.avatar_url,
      name: userData.name,
      bio: userData.bio,
      email: userData.email,
      // phoneNumber: userData.phoneNumber,
      registerDate: userData.created_at
    })
  })
})


//-------------------------------------------------------------------------------------------------------------


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
  // let loginedId = req.user.loginId;
  let chatListImageArray = [];
  let profileImageArray = [];
  db.query(`SELECT * FROM chatroom WHERE chatReceiver=? OR chatSender=?`, [userId, userId], function (error, room) {
    if (error) {
      throw `Error From /:userId/admin/contact ROUTER \n ERROR : ${error}`;
    }
    res.render('mypage/contact', {
      userId: userId,
      // loginedId: loginedId,
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
  let userId = req.params.userId; // Contacted user ID
  let loginId;
  if (!req.user) {
    res.redirect(`/auth/login`)
  } else {
    loginId = req.user.loginId;
    let roomName = `${loginId}-${userId}`;
    db.query(`SELECT * FROM chatroom WHERE roomName=?`, [roomName], function (err, roomCheck) {
      if (err) {
        throw `Error from /:userId/contact Router \n${err}`
      }
      // Checks Room Exist
      if (roomCheck[0] === undefined) {
        // Create Room
        db.query(`INSERT INTO chatroom (roomName, chatReceiver, chatSender) VALUES (?,?,?)`, [roomName, userId, loginId])
        res.redirect(`/${loginId}/admin/contact`)
      } else {
        res.redirect(`/${loginId}/admin/contact`)
      }
    })
  }
});

module.exports = router;