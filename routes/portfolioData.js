const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const aws = require('aws-sdk') // Amazon SDK Module
const multer = require("multer"); // File Upload Module
const multerS3 = require('multer-s3'); // Amazon S3 Storage Upload Module
const QRCode = require('qrcode'); // QR Code Generator Module
const showdown = require('showdown') // Markdown Module
const moment = require('moment');
const cryptoRandomString = require('crypto-random-string');

const router = express.Router();
router.use(bodyParser.json());
router.use(express.static(path.join(__dirname, "public")));

/* Database Schema */
const db = require("../lib/db"); // DB Connection Module
const User = require('../lib/models/userModel');
const Repo = require('../lib/models/repoModel');

// Parsing Dependency
const request = require("request"); // Request Module

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
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      let userId = req.params.userId;
      let uniqueNumber = cryptoRandomString({
        length: 10,
        type: 'numeric'
      }); // Math.random() function was not used as a security issue
      User.find({
          'login': userId
        },
        function (err, userData) {
          if (err) throw err;
          userData = userData[0];
          let fullPath = `members/${userData.id}-${userData.login}/${uniqueNumber}-${req.body.projectName}-${file.originalname}`;
          cb(null, fullPath);
        })
    }
  })
});

function loginCheck(req) {
  // Owner Check
  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    return req.user.username;
  }
}

/* DB Data Null Check */
function dataNullCheck(data) {
  if (data === null) {
    return '';
  }
}

/* GET home page. */
router.get(`/:userId`, function (req, res, next) {
  let userId = req.params.userId;
  let ownerCheck;

  /* User Login Check  */
  if (req.user == undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.username;
  }

  /* QR Code Process */
  let fullUrl = `${req.protocol}'://'${req.get('host')}${req.originalURL}`;
  QRCode.toDataURL(fullUrl, function (err, qrCodeImageURL) {
    if (err) throw err;
    /* User Data not Exists */
    User.find({
      'login': userId
    }, function (err, userData) {
      if (err) throw err;
      if (userData.length == 0) { // If user data is Null([])
        res.render('customError', { // User Missing Error Handling
          userId: userId, // Entered User ID
          loginedId: ownerCheck, // Logined User ID
          errorMessage: 'USER NOT EXIXTS',
          description: 'Report Please'
        })
      } else {
        /* User Data Exists */
        Repo.find({
          'owner.login': userId
        }, function (err, repoData) {
          if (err) throw err;
          let repo = repoData;

          let languageNameArray = require('../config/languageNames')
          repo.forEach(function (repo) {
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
          })
          res.render("portfolioItems", {
            dataarray: repo,
            userId: userId,
            qrCodeImageURL,
            ownerCheck
          });
        })
      }
    })
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
router.post("/:userId/create_process", upload.single("imageURL"), function (
  req,
  res
) {
  let userId = req.params.userId;
  let githubURL = req.body.githubURL

  if (!githubURL.startsWith(userId, 19)) {
    console.log(`Its not your repository!`)
    res.redirect(`/${userId}`)
  } else {
    console.log(req.file.location)
    Repo.create({
      owner: {
        login: userId
      },
      html_url: req.body.githubURL,
      name: req.body.projectName,
      projectType: req.body.projectType,
      language: req.body.keyword,
      imageURL: req.file.location,
      created_at: req.body.projectDate1,
      updated_at: req.body.projectDate2,
      homepage: req.body.projectDemoURL,
      description: req.body.description,
    }, function (err, data) {
      if (err) throw err;
    })
  }
  res.redirect(`/${userId}`);
});

/* Delete Process */
router.post("/:userId/:pageId/delete_process", function (req, res, next) {
  // GET userId
  let userId = req.params.userId;
  let pageId = req.params.pageId;

  /* Remove AWS S3 Image */
  Repo.findOne({
    'owner.login': userId,
    'name': pageId
  }, function (err, repo) {
    if (err) throw err;
    console.log(repo.imageURL)
    if (repo.imageURL == null) {} else if (repo.imageURL.startsWith('https://portfolioworld')) {
      let params = {
        Bucket: 'portfolioworld',
        Key: repo.imageURL.substr(55)
      };
      console.log(params.Key)
      s3.deleteObject(params, function (err, data) {
        if (err) throw err;
      })
    }
    /* Remove MongoDB Documnet */
    Repo.deleteOne({
      'owner.login': userId,
      'name': pageId
    }, function (err, result) {
      if (err) throw err;
    })
  })
  res.redirect(`/${userId}`);
  return false;
});

/* GET Update Page */
router.get("/:userId/:pageId/update", function (req, res) {
  let userId = req.params.userId;
  let pageId = req.params.pageId;

  Repo.findOne({
    'owner.login': userId,
    'name': pageId
  }, function (err, repo) {
    if (err) throw err;
    let languageNameArray = require('../config/languageNames')
    let imageName = (repo.language || '').toLowerCase();
    /* If AWS Image Exists */
    if (repo.imageURL) {
      console.log(`AWS Image Exist : ${repo.imageURL}`)
    } else if (languageNameArray.includes(imageName) == false) {
      repo.imageURL = `/images/app/${repo.projectType}.png`
    } else if (languageNameArray.includes(imageName) == true) {
      let lowercaseLanguage = (repo.language || '').toLowerCase().replace(/\+/g, '%2B').replace(/\#/g, "%23");
      repo.imageURL = `https://portfolioworld.s3.ap-northeast-2.amazonaws.com/devicon/${lowercaseLanguage}/${lowercaseLanguage}-original.svg`
    } else if (repo.language == null && repo.imageURL == null) {
      repo.imageURL = `/images/app/${repo.projectType}.png`
    }
    if(repo.homepage==null){
      repo.homepage='';
    }

    res.render("update", {
      userId: userId,
      pageId: pageId,
      projectName: repo.name,
      projectType: repo.projectType,
      keywords: repo.language,
      projectDemoURL: repo.homepage,
      description: repo.description,
      imageURL: repo.imageURL,
      created_at: moment(repo.created_at).format('YYYY-MM'),
      updated_at: moment(repo.updated_at).format('YYYY-MM'),
      githubURL: repo.html_url
    })
  });
});

/* POST Update Page */
router.post(
  "/:userId/:pageId/update_process",
  upload.single("imageURL"),
  function (req, res) {
    let userId = req.params.userId;
    let pageId = req.params.pageId;

    if (req.file == undefined) {
      Repo.findOneAndUpdate({
        'owner.login': userId,
        'name': pageId
      }, {
        $set: {
          name: req.body.projectName,
          projectType: req.body.projectType,
          projectDemoURL: req.body.projectDemoURL,
          description: req.body.description,
          language: req.body.keywords,
          created_at: req.body.created_at,
          updated_at: req.body.updated_at,
          githubURL: req.body.githubURL,
        }
      }, {
        returnNewDocument: true
      }, function (err, doc) {
        if (err) throw err;
        // console.log(doc);
      })

    } else {

      Repo.findOneAndUpdate({
        'owner.login': userId,
        'name': pageId
      }, {
        $set: {
          name: req.body.projectName,
          projectType: req.body.projectType,
          projectDemoURL: req.body.projectDemoURL,
          description: req.body.description,
          imageURL: req.file.location,
          language: req.body.keywords,
          created_at: req.body.created_at,
          updated_at: req.body.updated_at,
          githubURL: req.body.githubURL,

        }
      }, {
        returnNewDocument: true
      }, function (err, doc) {
        if (err) throw err;
        // console.log(doc);
      })
    }

    res.redirect(`/${userId}`);
  }
);

/* GET Detail View Page */
router.get("/:userId/:pageId", function (req, res, next) {
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  let ownerCheck;

  // Owner Check
  if (req.user == undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.username;
  }

  /* Invalid user page */
  Repo.find({
    'owner.login': userId,
    'name': pageId
  }, function (err, repoData) {
    if (err) throw err;
    if (repoData.length == 0) {
      console.log('Wrong Page or invalid user or repo Page')
      res.render('customError', { // User Missing Error Handling
        userId: userId, // Entered User ID
        loginedId: ownerCheck, // Logined User ID
        errorMessage: 'USER MISSING',
        description: 'Report Please'
      });
    } else {
      repo = repoData[0]; // To use easier

      let languageNameArray = require('../config/languageNames')

      let imageName = (repo.language || '').toLowerCase();
      /* If AWS Image Exists */
      if (repo.imageURL) {
        console.log(`AWS Image Exist : ${repo.imageURL}`)
      } else if (languageNameArray.includes(imageName) == false) {
        repo.imageURL = `/images/app/${repo.projectType}.png`
      } else if (languageNameArray.includes(imageName) == true) {
        let lowercaseLanguage = (repo.language || '').toLowerCase().replace(/\+/g, '%2B').replace(/\#/g, "%23");
        repo.imageURL = `https://portfolioworld.s3.ap-northeast-2.amazonaws.com/devicon/${lowercaseLanguage}/${lowercaseLanguage}-original.svg`
      } else if (repo.language == null && repo.imageURL == null) {
        repo.imageURL = `/images/app/${repo.projectType}.png`
      }


      /* Detail View Counter Prcoess */
      if (repo.detailViewCounter == undefined) {
        repo.detailViewCounter = 0; // Not to show 'undefined' in pug view
        /* Create detailViewCounter in document process */
        Repo.findOneAndUpdate({
          'owner.login': userId,
          'name': pageId
        }, {
          $set: {
            detailViewCounter: 0
          }
        }, {
          new: true,
          upsert: false,
          useFindAndModify: false
        }, (err, doc) => {
          if (err) throw err;
        });

      } else {
        Repo.findOneAndUpdate({
          'owner.login': userId,
          'name': pageId
        }, {
          $inc: {
            detailViewCounter: +1
          }
        }, {
          new: true,
          upsert: false,
          useFindAndModify: false
        }, (err, doc) => {
          if (err) throw err;
        });
      }

      /* Project Term Process */
      let created_at = repo.created_at.toISOString().substr(0, 10).replace('T', ' ');
      let updated_at = repo.updated_at.toISOString().substr(0, 10).replace('T', ' ');
      let fullName = repo.html_url.replace(/^\/\/|^https?:\/\/github.com\//g, '') // Get real README.md file

      /* README.md API Process */
      request({
          headers: {
            'User-Agent': 'request',
            'accept': 'application/vnd.github.VERSION.raw',
            'Authorization': `token ${process.env.GITHUB_DATA_ACCESS_TOKEN}`,
            'charset': 'UTF-8'
          },
          json: true,
          url: `https://api.github.com/repos/${fullName}/readme`
        },
        function (error, response, readmeData) {
          if (response.statusCode == 404) {
            readmeHTML = 'No Readme.MD file';
          } else {
            if (error) throw error;
            converter = new showdown.Converter(),
              readmeHTML = converter.makeHtml(readmeData);
          }

          /* Language List API Process */
          request({
              headers: {
                'User-Agent': 'request',
                'accept': 'application/vnd.github.VERSION.raw',
                'Authorization': `token ${process.env.GITHUB_DATA_ACCESS_TOKEN}`,
                'charset': 'UTF-8'
              },
              json: true,
              url: `https://api.github.com/repos/${userId}/${repo.name}/languages`
            },
            function (error, response, keyword) {
              console.log(response.statusCode)
              if (response.statusCode == 404) {
                keyword = '';
              } else {
                if (error) throw error;
                if (Object.keys(keyword).length == 0) {
                  keyword = '';
                }
              }
              res.render("detail", {
                userId: userId,
                pageId: pageId,
                projectName: repo.name,
                imageURL: repo.imageURL,
                projectType: repo.projectType,
                keyword,
                created_at,
                updated_at,
                description: repo.description,
                projectDemoURL: repo.homepage,
                githubURL: repo.html_url,
                detailViewCounter: repo.detailViewCounter,
                markdown: readmeHTML,
                // email: repoData.email,
                // phoneNumber: repoData.phoneNumber,
                ownerCheck
              })
            });
        })
    }
  });

});


module.exports = router;