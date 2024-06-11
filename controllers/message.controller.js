const httpStatus = require("http-status");
const ApiError = require("../errors/ApiError");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const catchAsync = require("../shared/CatchAsync");
const sendResponse = require("../shared/sendResponse");

// //!
exports.getMessages = catchAsync(async (req, res, next) => {
  try {
    const limits = req.query.limit;
    const pages = req.query.page;
    const page = Number(pages || 1);
    const limit = Number(limits || 10);
    const skip = (page - 1) * limit;
    const { id } = req.params;
    const conversation = await Message.find({
      conversationId: id,
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await Message.countDocuments({ conversationId: id });

    const totalPage = Math.ceil(total / limit);
    const messages = conversation;

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Messages retrieved successful",
      data: messages,
      // pagination: {
      //   page,
      //   limit,
      //   totalPage,
      // },
    });
  } catch (error) {
    //@ts-ignore
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
//!

exports.conversationId = catchAsync(async (req, res, next) => {
  const senderId = req.user?._id;
  const receiverId = req.params.id;
  const isUserExist = await User.findById(senderId);
  const isReceiverUserExist = await User.findById(receiverId);

  if (!isUserExist) {
    throw new ApiError(404, "Sender User does not exist");
  }
  if (!isReceiverUserExist) {
    throw new ApiError(404, "Receiver User does not exist");
  }

  const result = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  const conversationId = result?._id;

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversation ID retrieved successful",
    data: { conversationId },
  });
});
exports.conversationUser = catchAsync(async (req, res, next) => {
  const limits = req.query.limit;
  const pages = req.query.page;
  const page = Number(pages || 1);
  const limit = Number(limits || 10);
  const skip = (page - 1) * limit;
  const userId = req.user?._id;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await Conversation.countDocuments({ conversations });

  const totalPage = Math.ceil(total / limit);
  const conversationInfo = await Promise.all(
    conversations.map(async (conversation) => {
      const otherParticipantId = conversation.participants.find(
        (participant) => participant.toString() !== userId.toString()
      );

      const otherParticipant = await User.findById(otherParticipantId);

      return {
        conversationId: conversation._id,
        productId: conversation?.productId,
        user: otherParticipant,
      };
    })
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversation information retrieved successfully",
    data: conversationInfo,
    pagination: {
      page,
      limit,
      totalPage,
    },
  });
});
