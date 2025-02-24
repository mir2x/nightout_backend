
import express from "express";
import { authorize, canAccessSettings } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";
import AdminServices from "@services/adminSevices";

const router = express.Router();

router.post("/login", authorize, canAccessSettings, asyncHandler(AdminServices.login));
router.post("/recovery", authorize, canAccessSettings, asyncHandler(AdminServices.recovery));
router.post("/recovery-verification", authorize, canAccessSettings, asyncHandler(AdminServices.recoveryVerification));
router.post("/reset-password", authorize, canAccessSettings, asyncHandler(AdminServices.resetPassword));
router.post("/change-password", authorize, canAccessSettings, asyncHandler(AdminServices.changePassword));
router.patch("/update", authorize, canAccessSettings, asyncHandler(AdminServices.updateAdminInfo));
router.patch("/update/:id", authorize, canAccessSettings, asyncHandler(AdminServices.updateAdminById));
router.delete("/delete/:id", authorize, canAccessSettings, asyncHandler(AdminServices.removeAdminById));
router.get("/get-all-admins", authorize, canAccessSettings, asyncHandler(AdminServices.getAllAdmins));
router.get("/", authorize, canAccessSettings, asyncHandler(AdminServices.getAdminInfo));

export default router;
