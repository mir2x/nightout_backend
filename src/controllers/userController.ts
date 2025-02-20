import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  let error, user;
  [error, user] = await to(User.findById(userId).populate({ path: "auth", select: "email" }));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  return res.status(StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: user });
};

// const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const { search } = req.query;
//   const page = parseInt(req.query.page as string, 10) || 1;
//   const limit = parseInt(req.query.limit as string, 10) || 10;
//   const skip = (page - 1) * limit;
//
//   if (page < 1 || limit < 1) {
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       success: false,
//       message: "Page and limit must be positive integers",
//       data: {}
//     });
//   }
//
//   let users, total;
//
//   if (search) {
//     const aggregation = [
//       {
//         $lookup: {
//           from: "auths",
//           localField: "auth",
//           foreignField: "_id",
//           as: "authDetails"
//         }
//       },
//       {
//         $unwind: {
//           path: "$authDetails",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $match: {
//           $or: [
//             { "authDetails.email": { $regex: search, $options: "i" } },
//             { name: { $regex: search, $options: "i" } },
//             { phoneNumber: { $regex: search, $options: "i" } },
//             { gender: search },
//             { address: { $regex: search, $options: "i" } }
//           ]
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           "authDetails.email": 1,
//           phoneNumber: 1,
//           gender: 1,
//           age: 1,
//           address: 1,
//           "authDetails.isBlocked": 1
//         }
//       },
//       {
//         $skip: skip
//       },
//       {
//         $limit: limit
//       }
//     ];
//     users = await User.aggregate(aggregation);
//     const countAggregation = [
//       {
//         $lookup: {
//           from: "auths",
//           localField: "auth",
//           foreignField: "_id",
//           as: "authDetails"
//         }
//       },
//       {
//         $unwind: {
//           path: "$authDetails",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $match: {
//           $or: [
//             { "authDetails.email": { $regex: search, $options: "i" } },
//             { name: { $regex: search, $options: "i" } },
//             { phoneNumber: { $regex: search, $options: "i" } },
//             { gender: search },
//             { address: { $regex: search, $options: "i" } }
//           ]
//         }
//       },
//       {
//         $count: "total"
//       }
//     ];
//     const totalResult = await User.aggregate(countAggregation);
//     total = totalResult[0]?.total || 0;
//   } else {
//     const fetchedUsers = await to(
//       User.find()
//         .populate({ path: "auth", select: "email isBlocked" })
//         .select("name avatar phoneNumber gender age address survey")
//         .lean()
//         .skip(skip)
//         .limit(limit)
//     );
//     users = fetchedUsers || [];
//     total = await User.countDocuments();
//   }
//
//   const totalPages = Math.ceil(total / limit);
//
//   if (!users || users.length === 0) {
//     return res.status(StatusCodes.OK).json({
//       success: true,
//       message: "No users found",
//       data: {
//         users: [],
//         pagination: search
//           ? undefined
//           : {
//             page,
//             limit,
//             total: 0,
//             totalPages: 0
//
//           }
//       }
//     });
//   }
//
//   res.status(StatusCodes.OK).json({
//     success: true,
//     message: "Successfully retrieved users information",
//     data: {
//       users,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages
//       }
//     }
//   });
// };
//

const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { search } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
      data: {}
    });
  }

  const matchCriteria = search ? {
    $or: [
      { "authDetails.email": { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { gender: search },
    ]
  } : {};

  const aggregation = [
    {
      $lookup: {
        from: "auths",
        localField: "auth",
        foreignField: "_id",
        as: "authDetails"
      }
    },
    { $unwind: { path: "$authDetails", preserveNullAndEmptyArrays: true } },
    { $match: matchCriteria },
    {
      $project: {
        name: 1,
        "authDetails.email": 1,
        phoneNumber: 1,
        gender: 1,
        age: 1,
        "authDetails.isBlocked": 1
      }
    },
    { $skip: skip },
    { $limit: limit }
  ];

  const countAggregation = [
    ...aggregation.slice(0, 4),
    { $count: "total" }
  ];

  let users, total;

  if (search) {
    users = await User.aggregate(aggregation);
    const totalResult = await User.aggregate(countAggregation);
    total = totalResult[0]?.total || 0;
  } else {
    const fetchedUsers = await to(
      User.find()
        .populate({ path: "auth", select: "email isBlocked" })
        .select("name avatar phoneNumber gender age survey")
        .lean()
        .skip(skip)
        .limit(limit)
    );
    users = fetchedUsers || [];
    total = await User.countDocuments();
  }

  const totalPages = Math.ceil(total / limit);

  if (!users.length) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No users found",
      data: {
        users: [],
        pagination: search ? undefined : { page, limit, total: 0, totalPages: 0 }
      }
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved users information",
    data: {
      users,
      pagination: { page, limit, total, totalPages }
    }
  });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const updates = req.body;

  if (updates.dateOfBirth && updates.dateOfBirth.day) {
    updates.dateOfBirth.day = Number(updates.dateOfBirth.day);
  }

  if (updates.dateOfBirth && updates.dateOfBirth.month) {
    updates.dateOfBirth.month = Number(updates.dateOfBirth.month);
  }

  if (updates.dateOfBirth && updates.dateOfBirth.year) {
    updates.dateOfBirth.year = Number(updates.dateOfBirth.year);
  }

  if (updates.footsize) {
    updates.footsize = Number.parseFloat(updates.footsize);
  }

  if (updates.interests) {
    updates.interests = JSON.parse(updates.interests);
  }

  const [error, user] = await to(User.findByIdAndUpdate(userId, { $set: updates }, { new: true }));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
};

const UserController = {
  get,
  getAllUsers,
  update
};

export default UserController;
