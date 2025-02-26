import express from "express";
import { asyncHandler } from "@shared/asyncHandler";
import BarController from "@controllers/barControllers";
import { admin_authorize, canAccessBar } from "@middlewares/authorization";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";

const router = express.Router();

router.post("/create", admin_authorize, canAccessBar, fileUpload(), fileHandler, asyncHandler(BarController.create));
router.get("/get-all-bars", admin_authorize, canAccessBar, asyncHandler(BarController.getAllBars));
router.get("/:id", admin_authorize, canAccessBar, asyncHandler(BarController.getById));
router.patch("/update/:id", admin_authorize, canAccessBar, fileUpload(), fileHandler, asyncHandler(BarController.update));
router.delete("/delete/:id", admin_authorize, canAccessBar,asyncHandler(BarController.remove));
export default router;
