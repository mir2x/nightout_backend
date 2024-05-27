const express = require("express");
const { checkUser } = require("../middlewares/checkuser");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const configureFileUpload = require("../middlewares/fileUpload");

router.post(
  "/send-message/:id", //receiverId
  configureFileUpload(),
  checkUser,
  messageController.sendMessage
);
router.get(
  "/get-message/:id", //conversationId
  checkUser,
  messageController.getMessages
);
router.get(
  "/get-conversation/:id", //userId
  checkUser,
  messageController.conversationUser
);

// router.post("/verify-email", configureFileUpload(), userController.verifyEmail);

module.exports = router;
