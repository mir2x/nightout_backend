import AuthController from "@controllers/authController";
import express from "express";
import { authorize } from "@middlewares/authorization";
import { asyncHandler, asyncSessionHandler } from "@shared/asyncHandler";

const router = express.Router();

router.post("/register", asyncSessionHandler(AuthController.register));
router.post("/activate", asyncHandler(AuthController.activate));
router.post("/login", asyncHandler(AuthController.login));
router.post("/resend-otp", AuthController.resendOTP);
router.post("/recovery", AuthController.recovery);
router.post("/recovery-verification", AuthController.recoveryVerification);
router.post("/reset-password", AuthController.resetPassword);
router.post("/change-password", authorize, AuthController.changePassword);
router.delete("/delete", authorize, AuthController.remove);

export default router;
