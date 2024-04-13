const mongoose = require("mongoose");
const User = require("./user.model");
const Category = require("./category.model");
const productSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User' 
        },
        productName: {
            type: String,
            required: true,
            trim: true,
        },
        productImage: {
            type: Array,
            required: true,
           
            
        },
        productLocation: {
            type: String,
            required: true,
            trim: true,
        },
        productDescription: {
            type: String,
            trim: true,
        },

        productCategory: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Category'
        },
        productPrice: {
            type: Number,
            required: true,
            trim: true,
        },

        productStatus: {
            type: String,
            enum: ["NEW", "USED"],
            default: "USED",
        },

        descriptionBasedOnCategory: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;