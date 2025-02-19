import { Schema, model, Document, Model, ClientSession } from "mongoose";
import { Role } from "@shared/enums";
import bcrypt from "bcrypt";
import to from "await-to-ts";
import generateOTP from "@utils/generateOTP";
import { generateToken } from "@utils/jwt";

export type AuthSchema = Document & {
  email: string;
  password: string;
  role: Role;
  verificationOTP: string;
  verificationOTPExpiredAt: Date | null;
  recoveryOTP: string;
  recoveryOTPExpiredAt: Date | null;
  isVerified: boolean;
  comparePassword(password: string): Promise<boolean>;
  generateVerificationOTP(): void;
  clearVerificationOTP(): void;
  isCorrectVerificationOTP(otp: string): boolean;
  isVerificationOTPExpired(): boolean;
  generateRecoveryOTP(): void;
  clearRecoveryOTP(): void;
  isCorrectRecoveryOTP(otp: string): boolean;
  isRecoveryOTPExpired(): boolean;
};

const authSchema: Schema<AuthSchema> = new Schema<AuthSchema>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(Role),
    required: true,
  },
  verificationOTP: {
    type: String,
  },
  verificationOTPExpiredAt: {
    type: Date,
  },
  recoveryOTP: {
    type: String,
  },
  recoveryOTPExpiredAt: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

authSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

authSchema.methods.generateVerificationOTP = function (): void {
  this.verificationOTP = generateOTP();
  this.verificationOTPExpiredAt = new Date(Date.now() + 60 * 60 * 1000);
};

authSchema.methods.clearVerificationOTP = function (): void {
  this.verificationOTP = "";
  this.verificationOTPExpiredAt = null;
};

authSchema.methods.isCorrectVerificationOTP = function (otp: string): boolean {
  return this.verificationOTP === otp;
};

authSchema.methods.isVerificationOTPExpired = function (): boolean {
  return this.verificationOTPExpiredAt !== null && this.verificationOTPExpiredAt < new Date();
};

authSchema.methods.generateRecoveryOTP = function (): void {
  this.recoveryOTP = generateOTP();
  this.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 60 * 1000);
};

authSchema.methods.clearRecoveryOTP = function (): void {
  this.recoveryOTP = "";
  this.recoveryOTPExpiredAt = null;
};

authSchema.methods.isCorrectRecoveryOTP = function (otp: string): boolean {
  return this.recoveryOTP === otp;
};

authSchema.methods.isRecoveryOTPExpired = function (): boolean {
  return this.recoveryOTPExpiredAt !== null && this.recoveryOTPExpiredAt < new Date();
};

authSchema.pre<AuthSchema>("save", async function (next) {
  if (!this.isModified(this.password)) {
    return next();
  }
  const [error, hashedPassword] = await to(bcrypt.hash(this.password, 10));
  if (error) return next(error);
  this.password = hashedPassword;
  return next();
});

export type AuthModel = Model<AuthSchema> & {
  findByEmail(email: string): Promise<AuthSchema | null>;
  generateAccessToken(id: string): string;
};

authSchema.statics.generateAccessToken = function (id: string): string {
  return generateToken(id, process.env.JWT_ACCESS_SECRET!);
};

authSchema.statics.findByEmail = async function (email: string): Promise<AuthSchema | null> {
  return this.findOne({ email }).select("-password").exec();
};

const Auth = model<AuthSchema, AuthModel>("Auth", authSchema);
export default Auth;
