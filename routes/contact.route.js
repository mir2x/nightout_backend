const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");
const { checkUser } = require("../middlewares/checkuser.js");


router.post("/contact", configureFileUpload(), contactController.mailSend);

router.get("/contact",checkUser, configureFileUpload(), contactController.fetchAllMail);
module.exports = router;