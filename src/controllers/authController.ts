import to from "await-to-ts";
import mongoose from "mongoose";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import Auth from "@models/authModel";
import User from "@models/userModel";
import sendEmail from "@utils/sendEmail";
import { logger } from "@shared/logger";

const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { userName, email, phoneNumber, password, confirmPassword } = req.body;

  let auth;
  auth = await Auth.findByEmail(email);
  if (auth) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ success: false, message: "Email already exists.", data: { isVerified: auth.isVerified } });
  }

  const session = req.session;
  auth = new Auth({
    email,
    password,
    isVerified: false,
    isBlocked: false,
  });
  auth.generateVerificationOTP();
  logger.info(auth.verificationOTP);
  await auth.save({ session });

  const user = new User({
    auth: auth._id,
    userName,
    phoneNumber,
  });
  await user.save({session});
  await sendEmail(email, auth.verificationOTP);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Registration successful",
    data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
  });
};

const activate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, verificationOTP } = req.body;
  logger.info(verificationOTP);
  let auth;
  auth = await Auth.findByEmail(email);
  if (!auth) throw createError(StatusCodes.NOT_FOUND, "User not found");

  if (!auth.isCorrectVerificationOTP(verificationOTP))
    throw createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please enter the correct code");

  if (auth.isVerificationOTPExpired())
    throw createError(StatusCodes.UNAUTHORIZED, "Verification OTP has expired.");

  auth.clearVerificationOTP();
  auth.isVerified = true;
  await auth.save();
  const accessToken = Auth.generateAccessToken(auth._id!.toString());

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Account successfully verified.",
    data: { accessToken: accessToken },
  });
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password } = req.body;
  let auth = await Auth.findByEmail(email);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));

  if (!(await auth.comparePassword(password)))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password. Please try again"));

  if (!auth.isVerified) return next(createError(StatusCodes.UNAUTHORIZED, "Verify your email first"));
  const accessToken = Auth.generateAccessToken(auth._id!.toString());

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken: accessToken },
  });
};

const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, status } = req.body;
  let error, auth, verificationOTP, recoveryOTP;
  [error, auth] = await to(Auth.findOne({ email: email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "Account not found"));

  if (status === "activate" && auth.isVerified)
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Your account is already verified. Please login.", data: {} });

  if (status === "activate" && !auth.isVerified) {
    auth.generateVerificationOTP();
    [error] = await to(auth.save());
    if (error) return next(error);
    await sendEmail(email, auth.verificationOTP);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "OTP resend successful", data: { verificationOTP } });
  }

  if (status === "recovery") {
    auth.generateRecoveryOTP();
    [error] = await to(auth.save());
    if (error) return next(error);
    await sendEmail(email, auth.recoveryOTP);
    return res.status(StatusCodes.OK).json({ success: true, message: "OTP resend successful", data: { recoveryOTP } });
  }
};

const recovery = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;

  let error, auth;
  [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  auth.generateRecoveryOTP();
  await sendEmail(email, auth.recoveryOTP);

  [error] = await to(auth.save());
  if (error) return next(error);

  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Success", data: { recoveryOTP: auth.recoveryOTP } });
};

const recoveryVerification = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, recoveryOTP } = req.body;
  let error, auth;

  [error, auth] = await to(Auth.findOne({ email }).select("-password"));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  if (auth.isRecoveryOTPExpired()) return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
  if (!auth.isCorrectRecoveryOTP(recoveryOTP))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please try again"));

  auth.clearRecoveryOTP();

  [error] = await to(auth.save());
  if (error) return next(error);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified.",
    data: {},
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password, confirmPassword } = req.body;
  let error, auth;

  [error, auth] = await to(Auth.findOne({ email: email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  if (password !== confirmPassword) return next(createError(StatusCodes.BAD_REQUEST, "Passwords don't match"));

  auth.password = password;
  [error] = await to(auth.save());
  if (error) return next(error);

  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = req.user;
  const { password, newPassword, confirmPassword } = req.body;
  let error, auth;

  [error, auth] = await to(Auth.findById(user.authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  if (!(await auth.comparePassword(password)))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong Password. Please try again."));

  auth.password = newPassword;
  [error] = await to(auth.save());
  if (error) return next(error);

  return res.status(StatusCodes.OK).json({ success: true, message: "Passowrd changed successfully", data: {} });
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const authId = req.user.authId;

  try {
    await Promise.all([Auth.findByIdAndDelete(authId), User.findByIdAndDelete(userId)]);
    return res.status(StatusCodes.OK).json({ success: true, message: "User Removed successfully", data: {} });
  } catch (e) {
    return next(e);
  }
};
const AuthController = {
  register,
  activate,
  login,
  resendOTP,
  recovery,
  recoveryVerification,
  resetPassword,
  changePassword,
  remove,
};

export default AuthController;
