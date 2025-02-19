import Cloudinary from "@shared/cloudinary";
import { NextFunction, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const uploadFileToCloudinary = async (file: UploadedFile, folder: string): Promise<string> => {
  try {
    return await Cloudinary.upload(file, folder);
  } catch (error: any) {
    throw new Error(`Failed to upload ${folder} file: ${error.message}`);
  }
};

export const fileHandler = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const fileFields = [
      { fieldName: "avatarImage", folder: "nightout/profile", key: "avatar" },
    ];

    if (req.files) {
      await Promise.all(
        fileFields.map(async ({ fieldName, folder, key }) => {
          if (fieldName == "content[contentImage]" || fieldName == "content[contentVideo]") {
            const file = req.files![fieldName];
            if (file) {
              req.body.content[key] = await uploadFileToCloudinary(file as UploadedFile, folder);
            }
          }
          const file = req.files![fieldName];
          if (file) {
            req.body[key] = await uploadFileToCloudinary(file as UploadedFile, folder);
          }
        })
      );
    }
    next();
  } catch (error: any) {
    next(createError(StatusCodes.BAD_REQUEST, error.message));
  }
};

export default fileHandler;
