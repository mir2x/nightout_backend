const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");
const configureFileUpload = require("../middlewares/fileUpload.js");
const { checkUser } = require("../middlewares/checkuser.js");
const productController = require("../controllers/product.controller.js");

router.post("/register", configureFileUpload(), userController.userRegister);

router.post("/verify-email", configureFileUpload(), userController.verifyEmail);
router.post("/login", configureFileUpload(), userController.userLogin);
router.post(
  "/forgot-password",
  configureFileUpload(),
  userController.forgotPassword
);
router.post(
  "/reset-password",
  configureFileUpload(),
  userController.resetPassword
);

router.get("/loggeduser", checkUser, userController.loggedUserData);

router.put(
  "/profile-update",
  checkUser,
  configureFileUpload(),
  userController.profileUpdate
);

router.post(
  "/change-password",
  checkUser,
  configureFileUpload(),
  userController.changePassword
);

router.post("/delete-account", checkUser, userController.deleteAccountByMe);
router.patch(
  "/block-account/:id",
  checkUser,
  userController.blockAccountByAdmin
);

router.patch(
  "/active-account/:id",
  checkUser,
  userController.activeAccountByAdmin
);

router.get("/all-users", checkUser, userController.allUsers);

router.get("/all-admin-account", checkUser, userController.allAdminFetch);

router.get("/all-seller", checkUser, productController.allSellerList);

router.get("/allstatusdata", checkUser, userController.allStatusData);

router.get("/seller-count", checkUser, userController.sellerCount);

router.get("/top-seller-list", checkUser, userController.topSellersList);

router.get(
  "/all-seller-details/:id",
  checkUser,
  productController.getSellerById
);

module.exports = router;
