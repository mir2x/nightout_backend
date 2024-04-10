const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            trim: true,
        },
       
        mobileNumber: {
            type: String,
            required: false,
            trim: true,
        },
        location: {
            type: String,
            required: false,
            trim: true,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "DELETE"],
            default: "ACTIVE",
        },
       
        termAndCondition: { type: Boolean, default: false, required: false },
        role: {
            type: String,
            required: false,
            enum: ["UNKNOWN", "USER","ADMIN","SUPER ADMIN"],
            default: "USER",
        },
        emailVerified: { type: Boolean, default: false, required: false },
        emailVerifyCode: { type: String, required: false, required: false },
        
        
        
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;