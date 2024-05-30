const ApiError = require("../errors/ApiError");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const catchAsync = require("../shared/CatchAsync");

// //!
exports.getMessages = catchAsync(async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    // const senderId = req.user?.userId;
    const io = req.app.get("io");

    const conversation = await Conversation.findOne({
      _id: conversationId,
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;
    // io.emit("getMessages", messages);
    return messages;
  } catch (error) {
    //@ts-ignore
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
// //!
exports.conversationUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check if the user exists
  const isUserExist = await User.findById(id);
  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }

  // Find conversations that include the user
  const result = await Conversation.find({
    participants: { $all: [id] },
  });

  // Filter out the current user from participants in each conversation
  const participantIds = result
    .map((conversation) =>
      conversation.participants.filter((user) => user.toString() !== id)
    )
    .flat();

  // Remove duplicate participant IDs
  const uniqueParticipantIds = [
    ...new Set(participantIds.map((id) => id.toString())),
  ];

  // Fetch user details for the remaining participant IDs
  const users = await User.find({ _id: { $in: uniqueParticipantIds } });
  return users;
});
