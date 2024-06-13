const httpStatus = require("http-status");
const Notification = require("../models/notification.model");
const catchAsync = require("../shared/CatchAsync");
const sendResponse = require("../shared/sendResponse");
const paginationCalculate = require("../helpers/paginationHelper");
const pick = require("../shared/pick");

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
exports.notifications = catchAsync(async (req, res, next) => {
  const paginationOptions = pick(req.query, ["limit", "page"]);
  const { limit, page, skip } = paginationCalculate(paginationOptions);
  const notifications = await Notification.find({ role: "ADMIN" })
    .populate("user")
    .skip(skip)
    .limit(limit);
  const total = await Notification.countDocuments(notifications);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification retrieved Successfully",
    pagination: {
      page,
      limit,
      total,
    },
    data: notifications,
  });
});
