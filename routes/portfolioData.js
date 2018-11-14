let express = require("express");
let router = express.Router();
var path = require("path");
const db = require("../lib/db");

router.use(express.static(path.join(__dirname, "public")));

// Parsing Dependency
let cheerio = require("cheerio");
let request = require("request");

// Multer Module
let multer = require("multer"); // multer모듈 적용 (for 파일업로드)
let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./public/images/"); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
});
let upload = multer({
  storage: storage
});

/* GET home page. */
router.get(`/:LinkedInUser`, function(req, res, next) {
  let userId = req.params.LinkedInUser;
  console.log(userId);
  db.query(
    "SELECT * FROM Personal_Data WHERE linkedInName='" + userId + "'",
    function(error, data) {
      // Log Data
      console.log(error);
      console.log(data);
      console.log(data.id);
      res.render("portfolioItems", {
        dataarray: data
        // id: data.id,
        // userid: data.linkedInName,
        // type: data.type,
        // name: data.name,
        // url: data.url,
        // sumlang: data.sumlang,
        // explanation: data.explanation
        // imgurl: checkImg
      });
    }
  );
});

/* GET Create Page */
router.get("/:userId/create", function(req, res, next) {
  let userId = req.params.userId;
  res.render("create", {
    // Sample Image
    imgurl:
      "https://via.placeholder.com/730x444?text=Portfolio Image will be display here!"
  });
});

/* POST Create_Process Page */
router.post("/:userId/create_process", upload.single("projectImg"), function(
  req,
  res,
  next
) {
  let sid = shortid.generate();
  // files information are in req.file object
  console.log(req.file);

  // Check Image Process
  let checkImg = req.file;
  // If there is no image use 404.png iamge
  if (checkImg === undefined) {
    checkImg = "app/404.png";
    console.log(checkImg);
  } else {
    // If Image is exist put original name
    checkImg = req.file.originalname;
  }

  // DB Write
  db.get("project")
    .push({
      id: sid,
      name: req.body.projectName,
      type: req.body.portType,
      url: req.body.projectUrl,
      explanation: req.body.projectExplanation,
      imgurl: checkImg,
      sumlang: req.body.sumLang,
      pjdate1: req.body.pjdate1,
      pjdate2: req.body.pjdate2,
      githuburl: req.body.githuburl
    })
    .write();
  res.redirect(`/`);
});

/* Delete Process */
router.post("/:userId/:pageId/delete_process", function(req, res, next) {
  // GET userId
  let userId = req.params.userId;
  let pageId = req.params.pageId;
  db.query(`DELETE FROM Personal_Data WHERE id=?`, [pageId], function(
    error,
    data
  ) {
    if (error) {
      throw error;
    }
    console.log(data);
  });

  // TO GET Image File Information

  //   let deleteFileName = data[0].imgurl;
  //   console.log(deleteFileName);

  //   console.log("ITEM : " + id + "DELETED!");

  //   // Prevent Delete Default Image
  //   if (
  //     deleteFileName === "app/404.png" ||
  //     deleteFileName === "app/Certificate.png" ||
  //     deleteFileName === "app/Education.png"
  //   ) {
  //     console.log("This DB has no Image, Do nothing with files");
  //   } else {
  //     // Delete Image File
  //     fs.unlink("./public/images/" + deleteFileName, function(err) {
  //       if (err) {
  //         throw err;
  //       }
  //       console.log(deleteFileName + "Deleted!");
  //     });
  //   }

  res.redirect("/");
});

/* GET Update Page */
router.get("/update/:pageId", function(req, res) {
  let id = req.params.pageId;
  console.log("ID PARAMETER IS : " + id);
  let data = db
    .get("project")
    .find({
      id: id
    })
    .value();
  // console.log(data);
  res.render("update", {
    id: id,
    name: data.name,
    type: data.type,
    url: data.url,
    explanation: data.explanation,
    imgurl: data.imgurl,
    startDate: data.pjdate1,
    endDate: data.pjdate2,
    githuburl: data.githuburl,
    sumlang: data.sumlang
  });
});

/* POST Update Page */
router.post("/update_process/:pageId", upload.single("projectImg"), function(
  req,
  res
) {
  let id = req.params.pageId;
  // console.log(id);
  // console.log(req.file);
  let data = db
    .get("project")
    .find({
      id: id
    })
    .value();
  // console.log(data);

  console.log(req.file);

  let checkImg;
  // If there is no image use 404.png iamge
  if (
    data.imgurl === undefined &&
    data.imgurl === "app/404.png" &&
    req.file === undefined
  ) {
    checkImg = "app/404.png";
    console.log(data.imgurl);
  } else if (req.file === undefined) {
    checkImg = data.imgurl;
    console.log(checkImg);
  } else {
    checkImg = req.file.originalname;
  }

  db.get("project")
    .find({
      id: id
    })
    .assign({
      id: id,
      name: req.body.projectName,
      type: req.body.portType,
      url: req.body.projectUrl,
      explanation: req.body.projectExplanation,
      imgurl: checkImg,
      sumlang: req.body.sumLang,
      pjdate1: req.body.pjdate1,
      pjdate2: req.body.pjdate2,
      githuburl: req.body.githuburl
    })
    .write();
  res.redirect("/" + id);
});

router.get("/resumeeng", function(req, res, next) {
  console.log("Hello");
  res.render("resumeeng", {});
});
router.get("/resumekor", function(req, res, next) {
  console.log("Hello");
  res.render("resumekor", {});
});

/* GET Detail View Page */
router.get("/:userId/:pageId", function(req, res, next) {
  // GET URL params and put it into :pageId
  let userId = req.params.userId;
  let sid = req.params.pageId;
  console.log(userId);
  console.log(sid);
  // GET data id to use Object
  db.query(`SELECT * FROM Personal_Data WHERE id=?`, [sid], function(
    error,
    data
  ) {
    if (error) {
      throw error;
    }
    console.log(data[0]);
    // Check Image Process
    let checkImg = data[0].imgurl;
    let checkType = data[0].type;
    // Check Image Validate
    if (checkImg === "app/404.png" || checkType === "Certificate") {
      // Type is Certificate but No Image then USE this link
      checkImg = "app/Certificate.png";
    }
    if (checkImg === "app/404.png" && checkType === "Education") {
      // Type is Certificate but No Image then USE this link
      checkImg = "app/Education.png";
    }
    // If there is no image use 404.png iamge
    if (checkImg === undefined) {
      checkImg = "sample.png";
      console.log(checkImg);
    } else {
      checkImg = data[0].imgurl;
    }

    // Get github URL
    let url = data[0].githuburl;
    console.log(url);
    // Use Request Module to parsing Web page
    request(url, function(error, response, html) {
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
        $("#readme").each(function() {
          // save to readme Variable
          readme = $(this).html();
        });
      }

      // Rendering
      console.log("No Problem with Detail Pages data");
      res.render("detail", {
        id: data[0].id,
        userId: userId,
        dataarray: data[0],
        type: data[0].type,
        name: data[0].name,
        url: data[0].url,
        explanation: data[0].explanation,
        imgurl: checkImg,
        markdown: readme,
        startDate: data[0].pjdate1,
        endDate: data[0].pjdate2,
        githuburl: data[0].githuburl,
        sumlang: data[0].sumlang
      });
    });
  });
});

module.exports = router;
