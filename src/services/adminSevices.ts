import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import Admin from "@models/adminModel";
import sendEmail from "@utils/sendEmail";
import Cloudinary from "@shared/cloudinary";

const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password } = req.body;
  let admin = await Admin.findByEmail(email);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));

  if (!(await admin.comparePassword(password)))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password. Please try again"));

  const accessToken = Admin.generateAccessToken(admin._id!.toString());

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken: accessToken },
  });
};

const recovery = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;

  let admin = await Admin.findByEmail(email);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));
  admin.generateRecoveryOTP();

  await sendEmail(email, admin.recoveryOTP);
  await admin.save();
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Success", data: { recoveryOTP: admin.recoveryOTP } });
};

const recoveryVerification = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, recoveryOTP } = req.body;

  let admin = await Admin.findByEmail(email);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "User not found"));
  if (admin.isRecoveryOTPExpired()) return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
  if (!admin.isCorrectRecoveryOTP(recoveryOTP))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please try again"));
  admin.clearRecoveryOTP();
  await admin.save();

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified.",
    data: {},
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password, confirmPassword } = req.body;

  let admin = await Admin.findByEmail(email);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));
  if (password !== confirmPassword) return next(createError(StatusCodes.BAD_REQUEST, "Passwords don't match"));

  admin.password = password;
  await admin.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const email = req.admin.email;
  const { password, newPassword, confirmPassword } = req.body;
  const admin = await Admin.findByEmail(email);
  if (!admin) throw createError(StatusCodes.NOT_FOUND, "Admin Not Found");
  if (!(await admin.comparePassword(password)))
    throw createError(StatusCodes.UNAUTHORIZED, "Wrong Password. Please try again.");

  admin.password = newPassword;
  await admin.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Password changed successfully", data: {} });
};


const getAllAdmins = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      {phoneNumber: { $regex: search, $options: "i" } },
    ]
  } : {};

  const admins = await Admin.find(matchCriteria).limit(limit).skip(skip).lean();
  const total = admins.length;
  const totalPages = Math.ceil(total / limit);

  return res.status(StatusCodes.OK).json({
    success: true, message: "Success", data: {
      admins,
      pagination: { page, limit, total, totalPages }
    }
  });

}

const getAdminInfo = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const email = req.admin.email;
  const admin = await Admin.findByEmail(email);
  return res.status(StatusCodes.OK).json({success: true, message: "Admin info successfully.", data: admin });
}

const updateAdminInfo = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const email = req.admin.email;
  const {updatedFields} = req.body;
  const admin = await Admin.findByEmail(email);
  if(!admin) throw createError(StatusCodes.NOT_FOUND, "Admin not found");
  if(updatedFields.avatar && admin.avatar) await Cloudinary.remove(admin.avatar);
  const updatedAdmin = await Admin.findByIdAndUpdate(admin._id, {$set: updatedFields}, {new: true});
  return res.status(StatusCodes.OK).json({success: true, message: "Admin updated successfully.", data: updatedAdmin });
}

const updateAdminById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const {updatedFields} = req.body;
  const admin = await Admin.findById(id);
  if(!admin) throw createError(StatusCodes.NOT_FOUND, "Admin not found");
  if(updatedFields.avatar && admin.avatar) await Cloudinary.remove(admin.avatar);
  const updatedAdmin = await Admin.findByIdAndUpdate(admin._id, {$set: updatedFields}, {new: true});
  return res.status(StatusCodes.OK).json({success: true, message: "Admin updated successfully.", data: updatedAdmin });
}

const removeAdminById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const admin = await Admin.findByIdAndDelete(id);
  if(!admin) throw createError(StatusCodes.NOT_FOUND, "Admin Not Found");
}


const AdminServices = {
  login,
  recovery,
  recoveryVerification,
  resetPassword,
  changePassword,
  getAllAdmins,
  getAdminInfo,
  updateAdminInfo,
  updateAdminById,
  removeAdminById
}

export default AdminServices;