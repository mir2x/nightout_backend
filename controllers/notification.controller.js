const httpStatus = require("http-status");
const Notification = require("../models/notification.model");
const catchAsync = require("../shared/CatchAsync");
const sendResponse = require("../shared/sendResponse");

exports.myNotification = catchAsync(async (req, res, next) => {
  const id = req.user?._id;
  const notifications = await Notification.find({ user: id });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My notification retrieved Successfully",
    data: notifications,
  });
});
