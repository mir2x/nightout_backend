const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");
const { checkUser } = require("../middlewares/checkuser.js");


router.post("/category", checkUser, configureFileUpload(), categoryController.categoryAdd);
router.get("/allcategory",categoryController.allCategoryShow);
router.get("/category/:id", checkUser, categoryController.categoryById);
router.delete("/category/:id", checkUser, categoryController.categoryDelete);
router.put("/category/:id", checkUser,configureFileUpload(), categoryController.categoryUpdate);
module.exports = router;