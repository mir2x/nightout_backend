import { DecodedUser } from "@schemas/decodedUser";
import { ClientSession } from "mongoose";
import fileUpload from "express-fileupload";

declare global {
  namespace Express {
    interface Request {
      user: DecodedUser;
      session: ClientSession;
      files?: fileUpload.FileArray | null | undefined;
    }
  }
}
