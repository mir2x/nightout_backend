const Product = require("../models/product.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const emailWithNodemailer = require("../config/email.config");
const sendResponse = require("../shared/sendResponse");
const ApiError = require("../errors/ApiError.js");
const httpStatus = require("http-status");
const catchAsync = require("../shared/CatchAsync.js");
const userTimers = new Map();
const fs = require("fs");
const path = require("path");
const pick = require("../shared/pick.js");
const paginationCalculate = require("../helpers/paginationHelper");


exports.productAdd = catchAsync(async (req, res, next) => {
    const { productName, productLocation, productDescription, productCategory, productPrice, productStatus, descriptionBasedOnCategory} = req.body;
    
    

    if (!productName ||  !productDescription ||  !productCategory ||  !productPrice ||  !productStatus ||  !descriptionBasedOnCategory || !productLocation) {
        throw new ApiError(400, "All Field are required");
    }

    const publicImageUrl = [];

    if (req.files && req.files.productImage) {
        req.files.productImage.forEach((file) => {
           const productImageUrl = `/public/uploads/images/${file.filename}`;
            //const publicFileUrl = createFileDetails('kyc', file.filename)
            publicImageUrl.push(productImageUrl);
        });
    }

    const product = await Product.create({
        userId:req.user._id,
        productName,
        productDescription,
        productCategory,
        productPrice,
        productStatus,
        productLocation,
        descriptionBasedOnCategory:JSON.parse(descriptionBasedOnCategory),
        productImage:publicImageUrl
    });

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product add successfully",
    });

    

});


exports.productShow = catchAsync(async (req, res, next) => {
    let query = {};

    // Check if category is provided in query parameters
    if (req.query.category) {
        query.productCategory = req.query.category;
    }


    // Pagination
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { limit, page, skip } = paginationCalculate(paginationOptions);

    let products = Product.find(query).skip(skip).limit(limit);

    products = products.populate("productCategory").sort({ createdAt: -1 });

    const productsDocument = await products.exec();
    const total = await Product.countDocuments();
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Products retrived successfully",
        pagination: {
            page,
            limit,
            total,
        },
        data: productsDocument
    });



});