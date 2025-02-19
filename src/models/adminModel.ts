import { model, Model, Schema } from "mongoose";
import * as readline from "node:readline";
import bcrypt from "bcrypt";
import { logger } from "@shared/logger";

export type AdminSchema = {
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  avatar: string;
}

const adminSchema : Schema<AdminSchema> = new Schema<AdminSchema>({
  userName: {
    type: String,
    required: true,
    default: "admin",
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  }
});

adminSchema.statics.findOrCreate = async function() : Promise<void> {
  let admin = await this.findOne();
  if(!admin) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const email = await new Promise<string>((resolve) => {
      rl.question("Enter email address: ", (answer) => resolve(answer));
    });
    const password = await new Promise<string>((resolve) => {
      rl.question("Enter password: ", (answer) => resolve(answer));
    });
    rl.close();

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.create({email, password, hashedPassword});
    logger.info("admin created successfully");
  } else {
    logger.info("admin account exists");
  }

}

type AdminModel = Model<AdminSchema> & {
  findOrCreate(): Promise<void>;
}

const Admin = model<AdminSchema, AdminModel>("Admin", adminSchema);
export default Admin;