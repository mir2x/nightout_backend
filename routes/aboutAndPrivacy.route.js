const express = require("express");
const router = express.Router();
const { checkUser } = require("../middlewares/checkuser.js");
const aboutController = require("../controllers/aboutus.controller.js");
const privacyController = require("../controllers/privacy.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");



router.post("/aboutus",checkUser,configureFileUpload(),aboutController.aboutus);
router.get("/aboutus",aboutController.aboutusFetch);


router.post("/privacy",checkUser,configureFileUpload(),privacyController.privacy);
router.get("/privacy",privacyController.privacyFetch);
module.exports = router