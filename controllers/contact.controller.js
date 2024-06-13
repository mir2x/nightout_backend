const Contact = require("../models/contact.model.js");
const sendResponse = require("../shared/sendResponse");
const ApiError = require("../errors/ApiError.js");
const httpStatus = require("http-status");
const catchAsync = require("../shared/CatchAsync.js");
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");
const emailWithNodemailer = require("../config/email.config");
const pick = require("../shared/pick.js");
const paginationCalculate = require("../helpers/paginationHelper");

exports.mailSend = catchAsync(async (req, res, next) => {
  const userExists = await User.findOne({ email: req.body.email });

  if (userExists) {
    const emailData = {
      email: userExists.email,
      subject: "Information email",
      html: `<div style="width:500px;height:400px;background-color:gray;border-radius:20px;padding:30px">
                     <h1 style="font-size:30px;color:white;font-weight:bold;margin-bottom:20px; text-align:center">Bazar 24/7</h1>
                     <h1 style="color:white">Hello, ${userExists?.fullName}</h1>
                     <p style="color:white">${req.body.description}</small>
                   </div>
                  `,
    };

    emailWithNodemailer(emailData);

    const contact = new Contact({
      userId: userExists._id,
      message: req.body.description,
    });

    await contact.save();

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Message sent successfully",
    });
  } else {
    throw new ApiError(404, "User not found");
  }
});

exports.fetchAllMail = catchAsync(async (req, res, next) => {
  if (req.user.role == "ADMIN" || "SUPER ADMIN") {
    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { search } = pick(req.query, ["search"]);

    const query = [];

    if (search) {
      const userIds = await User.find({
        fullName: { $regex: search, $options: "i" },
      }).distinct("_id");

      query.push({
        $or: [
          {
            userId: { $in: userIds },
          },
          {
            message: { $regex: search, $options: "i" },
          },
        ],
      });
    }

    const whereCondition = query.length > 0 ? { $and: query } : {};

    const { limit, page, skip } = paginationCalculate(paginationOptions);

    let contacts = Contact.find(whereCondition).skip(skip).limit(limit);

    contacts = contacts
      .populate({ path: "userId", select: "-password -role" })
      .sort({ createdAt: -1 });

    const contactsDocument = await contacts.exec();
    const total = await Contact.countDocuments(whereCondition);
    if (total == 0) {
      throw new ApiError(404, "Message not found");
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All message retrived successfully",
      pagination: {
        page,
        limit,
        total,
      },
      data: contactsDocument,
    });
  } else {
    throw new ApiError(401, "Unauthorized user");
  }
});
