const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const aws = require('aws-sdk') // Amazon SDK Module
const multer = require("multer"); // File Upload Module
const multerS3 = require('multer-s3'); // Amazon S3 Storage Upload Module
const QRCode = require('qrcode'); // QR Code Generator Module
const showdown = require('showdown') // Markdown Module
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
      let userId = req.params.userId
      console.log('------------------')
      User.find({
          'login': userId
        },
        function (err, userData) {
          if (err) throw err;
          userData = userData[0];
          let fullPath = `members/${userData.id}-${userData.login}/${userData.id}-${file.originalname}`;
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

/* GET home page. */
router.get(`/:userId`, function (req, res, next) {
  let userId = req.params.userId;
  let ownerCheck;
  let awsImageURL = `https://portfolioworld.s3.ap-northeast-2.amazonaws.com/members/`

  if (req.user === undefined) {
    ownerCheck = null;
  } else {
    ownerCheck = req.user.username;
  }

  /* QR Code Process */
  let fullUrl = `${req.protocol}'://'${req.get('host')}${req.originalURL}`;
  QRCode.toDataURL(fullUrl, function (err, qrCodeImageURL) {
    if (err) throw err;

    User.find({
      'login': userId
    }, function (err, userData) {
      if (err) throw err;
      if (userData.length == 0) { // If user data is Null([])
        res.render('customError', { // User Missing Error Handling
          userId: userId, // Entered User ID
          loginedId: ownerCheck, // Logined User ID
          errorMessage: 'USER MISSING',
          description: 'Report Please'
        })
      } else {

        let language_list = require('../config/devicon.json'); // official devicon json data
        let base_url = 'https://cdn.rawgit.com/konpa/devicon/master/icons/';
        /* special variable */
        const languages = {
          'html': 'html5',
          'css': 'css3',
          'c#': 'csharp',
          'c++': 'cplusplus'
        }
        Repo.find({
          'owner.login': userId
        }, 'projectType login id owner.id name imageURL language description', function (err, repoData) {
          if (err) throw err;

          for (repo of repoData) {
            let result_url;
            let lowercase_language;
            let imageNullCheck = repo.imageURL;
            /* If image file exists in AWS S3 Storage */
            if (!imageNullCheck.startsWith('/images/app/')) {
              repo.imageURL;
            } else {
              if (repo.language == 'Null' || repo.language == null) { // If null use default image
                result_url = `/images/app/${repo.projectType}.png` // default null image path
              } else {
                lowercase_language = repo.language.toLowerCase();
              }
              let url = (language_list.filter(function (item) {
                if (repo.language == null || repo.language == 'null') {
                  result_url = `/images/app/${repo.projectType}.png`
                } else if (item.name === lowercase_language) {
                  result_url = `${base_url}${lowercase_language}/${lowercase_language}-original.svg`
                }
              }))
              if (languages.hasOwnProperty(lowercase_language) == true) {
                lowercase_language = languages[lowercase_language];
                result_url = `${base_url}${lowercase_language}/${lowercase_language}-original.svg`
              } else if (url === false) {
                result_url = `/images/app/${repo.projectType}.png`
              }
              repo.imageURL = result_url
            }
          }
          /* Keyword Null Check */
          for (let i of repoData) {
            if (i.language === null || i.language === 'null') {
              i.language = 'Keyword not set';
            }
          }
          res.render("portfolioItems", {
            dataarray: repoData,
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
  let id = Math.floor(Math.random() * 10) * 1412433 + 5

  console.log(githubURL.startsWith(userId, 19))
  if (!githubURL.startsWith(userId, 19)) {
    console.log(`Its not your repository!`)
    res.redirect(`/${userId}`)
  } else {
    Repo.create({
      id: id,
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
  }, function (err, pageData) {
    if (err) throw err;
    if (!pageData.imageURL.startsWith('/images/app/')) {
      let params = {
        Bucket: 'portfolioworld',
        Key: pageData.imageURL.substr(55)
      };
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
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  let ownerCheck;
  let awsImageURL = `https://portfolioworld.s3.ap-northeast-2.amazonaws.com/members/`

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
      repoData = repoData[0]; // To use easier

      let language_list = require('../config/devicon.json'); // official devicon json data
      let base_url = 'https://cdn.rawgit.com/konpa/devicon/master/icons/';
      /* special variable */
      const languages = {
        'html': 'html5',
        'css': 'css3',
        'c#': 'csharp',
        'c++': 'cplusplus'
      }
      let result_url;
      let lowercase_language;
      let imageNullCheck = repoData.imageURL;
      if (!imageNullCheck.startsWith('/images/app/')) {
        repoData.imageURL;
      } else {
        if (repoData.language == 'Null' || repoData.language == null) { // If null use default image
          result_url = `/images/app/${repoData.projectType}.png` // default null image path
        } else {
          lowercase_language = repoData.language.toLowerCase();
        }
        let url = (language_list.filter(function (item) {
          if (repoData.language == null || repoData.language == 'null') {
            result_url = `/images/app/${repoData.projectType}.png`
          } else if (item.name === lowercase_language) {
            result_url = `${base_url}${lowercase_language}/${lowercase_language}-original.svg`
          }
        }))
        if (languages.hasOwnProperty(lowercase_language) == true) {
          lowercase_language = languages[lowercase_language];
          result_url = `${base_url}${lowercase_language}/${lowercase_language}-original.svg`
        } else if (url === false) {
          result_url = `/images/app/${repoData.projectType}.png`
        }
        repoData.imageURL = result_url
      }

      /* Detail View Counter Prcoess */
      if (repoData.detailViewCounter == undefined) {
        repoData.detailViewCounter = 0; // Not to show 'undefined' in pug view
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
      let created_at = repoData.created_at.toISOString().substr(0, 10).replace('T', ' ');;
      let updated_at = repoData.updated_at.toISOString().substr(0, 10).replace('T', ' ');
      let fullName = repoData.html_url.replace(/^\/\/|^https?:\/\/github.com\//g, '') // Get real README.md file

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
          if (repoData.languages_url == undefined) {
            res.render("detail", {
              userId: userId,
              pageId: pageId,
              projectName: repoData.name,
              imageURL: repoData.imageURL,
              projectType: repoData.projectType,
              keyword: '',
              created_at,
              updated_at,
              description: repoData.description,
              projectDemoURL: repoData.homepage,
              githubURL: repoData.html_url,
              detailViewCounter: repoData.detailViewCounter,
              markdown: readmeHTML,
              // email: repoData.email,
              // phoneNumber: repoData.phoneNumber,
              ownerCheck
            })
          } else {
            /* Language List API Process */
            request({
                headers: {
                  'User-Agent': 'request',
                  'accept': 'application/vnd.github.VERSION.raw',
                  'Authorization': `token ${process.env.GITHUB_DATA_ACCESS_TOKEN}`,
                  'charset': 'UTF-8'
                },
                json: true,
                url: repoData.languages_url
              },
              function (error, response, keywordData) {
                if (error) throw error;
                res.render("detail", {
                  userId: userId,
                  pageId: pageId,
                  projectName: repoData.name,
                  imageURL: repoData.imageURL,
                  projectType: repoData.projectType,
                  keyword: keywordData,
                  created_at,
                  updated_at,
                  description: repoData.description,
                  projectDemoURL: repoData.homepage,
                  githubURL: repoData.html_url,
                  detailViewCounter: repoData.detailViewCounter,
                  markdown: readmeHTML,
                  // email: repoData.email,
                  // phoneNumber: repoData.phoneNumber,
                  ownerCheck
                })
              });
          }
        })
    }
  });

});


module.exports = router;