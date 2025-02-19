import { Schema, model, Types, Document } from "mongoose";
import { Gender, Role } from "@shared/enums";

export type DecodedUser = {
  authId: string;
  userId: string;
  userName: string;
  email: string;
  role: Role;
  isVerified: boolean;
};

export type UserSchema = Document & {
  auth: Types.ObjectId;
  userName: string;
  avatar: string;
  phoneNumber: string;
  age: number;
  gender: string;
};

const userSchema = new Schema(
  {
    auth: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      default: Gender.NONE,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<UserSchema>("User", userSchema);
export default User;
