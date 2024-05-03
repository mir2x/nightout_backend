const mongoose = require("mongoose");
const User = require("./user.model");

const contactSchema = new mongoose.Schema(
    {

        userId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        message: {
            type: String,
            required: true,
        }
        
    },
    { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);
module.exports = Contact;