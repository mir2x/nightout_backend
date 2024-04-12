const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");
const { checkUser } = require("../middlewares/checkuser.js");


router.post("/category", checkUser, configureFileUpload(), categoryController.cateogryAdd);

module.exports = router;