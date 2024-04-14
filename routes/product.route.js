const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");
const { checkUser } = require("../middlewares/checkuser.js");


router.post("/product",checkUser, configureFileUpload(), productController.productAdd);
router.get("/product", productController.productShow);
router.get("/product/:id", productController.productShowById);
router.get("/product/specific/:userid", checkUser, productController.productForSpecificUser);
router.get("/product-me", checkUser, productController.myProduct);
module.exports = router;