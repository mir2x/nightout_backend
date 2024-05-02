const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");
const { checkUser } = require("../middlewares/checkuser.js");


router.post("/product",checkUser, configureFileUpload(), productController.productAdd);
router.get("/product", productController.productShow);
router.get("/product/:id",checkUser, productController.productShowById);
router.get("/product/specific/:userid", checkUser, productController.productForSpecificUser);
router.get("/product-me", checkUser, productController.myProduct);
router.get("/product/search/byname", checkUser, configureFileUpload(), productController.searchProducts);
router.get("/product/filter/byquery", checkUser, configureFileUpload(), productController.filterProducts);

router.put("/product/featured/:id", checkUser, configureFileUpload(), productController.feturedProduct);
router.get("/product/featured/all", checkUser, configureFileUpload(), productController.fetchFeaturedProduct);



router.put("/product/banner/:id", checkUser, configureFileUpload(), productController.bannerProduct);
router.get("/product/banner/all", checkUser, configureFileUpload(), productController.fetchBannerProduct);




router.put("/product/add/wishlist/:id", checkUser, configureFileUpload(), productController.productWishlist);
router.get("/product/wishlist/all", checkUser, configureFileUpload(), productController.fetchWishlistProduct);


router.put("/product/update/:id", checkUser, configureFileUpload(), productController.productUpdate);


router.delete("/product/:id", checkUser, productController.productDelete);
module.exports = router;