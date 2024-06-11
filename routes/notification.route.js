const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { checkUser } = require("../middlewares/checkuser");

router.get(
  "/my-notification",
  checkUser,
  notificationController.myNotification
);

module.exports = router;
