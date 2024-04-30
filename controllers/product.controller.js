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
const User = require("../models/user.model");

exports.productAdd = catchAsync(async (req, res, next) => {
    const { productName, productLocation, productDescription, productCategory, productPrice, productStatus, descriptionBasedOnCategory } = req.body;



    if (!productName || !productDescription || !productCategory || !productPrice || !productStatus || !descriptionBasedOnCategory || !productLocation) {
        throw new ApiError(400, "All Field are required");
    }

    const publicImageUrl = [];

    if (req.files && req.files.productImage) {
        req.files.productImage.forEach((file) => {
            const productImageUrl = `public/uploads/images/${file.filename}`;
            //const publicFileUrl = createFileDetails('kyc', file.filename)
            publicImageUrl.push(productImageUrl);
        });
    }

    const product = await Product.create({
        userId: req.user._id,
        productName,
        productDescription,
        productCategory,
        productPrice,
        productStatus,
        productLocation,
        descriptionBasedOnCategory: JSON.parse(descriptionBasedOnCategory),
        productImage: publicImageUrl
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

exports.productShowById = catchAsync(async (req, res, next) => {



    let product = await Product.find({ _id: req.params.id }).populate("productCategory");


    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product retrived successfully",
        data: product
    });



});

exports.productForSpecificUser = catchAsync(async (req, res, next) => {

    const isExist = await User.findOne({ _id: req.user._id });

    if (isExist.role == "ADMIN" || isExist.role == "SUPER ADMIN") {

        const userId = req.params.userid;

        if (!userId) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: "User ID is required",
                data: null
            });
        }

        const userProducts = await Product.find({ userId });
        if (userProducts.length === 0) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "No products found for the provided user ID",
                data: null
            });
        }

        let query = { userId };


        if (req.params.userId) {
            query.userId = req.params.userid;
        }

        // Check if category is provided in query parameters
        if (req.query.category) {
            query.productCategory = req.query.category;
        }



        const paginationOptions = pick(req.query, ["limit", "page"]);
        const { limit, page, skip } = paginationCalculate(paginationOptions);

        let products = Product.find(query).skip(skip).limit(limit);

        products = products.populate("productCategory").sort({ createdAt: -1 });

        const productsDocument = await products.exec();
        const total = userProducts.length;
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

    } else {
        throw new ApiError(401, "You are unathorized");
    }



});

exports.myProduct = catchAsync(async (req, res, next) => {



    const userId = req.user._id;

    const userProducts = await Product.find({ userId });
    if (userProducts.length === 0) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "No products found",
            data: null
        });
    }

    let query = { userId };

    // Check if category is provided in query parameters
    if (req.query.category) {
        query.productCategory = req.query.category;
    }



    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { limit, page, skip } = paginationCalculate(paginationOptions);

    let products = Product.find(query).skip(skip).limit(limit);

    products = products.populate("productCategory").sort({ createdAt: -1 });

    const productsDocument = await products.exec();
    const total = userProducts.length;
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



exports.productDelete = catchAsync(async (req, res, next) => {


    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    //const product = await Product.deleteOne({ _id: req.params.id, userId: req.user._id });

    if (!product) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Product not found for the provided Product ID and User ID",
            data: null
        });
    }

    await Product.findByIdAndDelete(req.params.id);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product deleted successfully",
        data: null
    });



});


exports.searchProducts = catchAsync(async (req, res, next) => {


    const products = await Product.find({
        productName: { $regex: req.body.productName, $options: 'i' },
    });



    if (products.length == 0) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Product not found!",
            data: null
        });
    }

    await Product.findByIdAndDelete(req.params.id);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product retrived successfully",
        data: products
    });



});


exports.filterProducts = catchAsync(async (req, res, next) => {

    const paginationOptions = pick(req.query, ['page', 'limit']);

    // Calculate page, limit, and skip values using paginationCalculate function
    const { page, limit, skip } = paginationCalculate(paginationOptions);

    const { name, minPrice, maxPrice, location } = req.query;

    // Construct filter object based on provided query parameters
    const filter = {};

    // Filter by product name (case-insensitive)
    if (name) {
        filter.productName = { $regex: name, $options: 'i' };
    }

    // Filter by price range
    if (minPrice && maxPrice) {
        filter.productPrice = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    } else if (minPrice) {
        filter.productPrice = { $gte: Number(minPrice) };
    } else if (maxPrice) {
        filter.productPrice = { $lte: Number(maxPrice) };
    }

    // Filter by location
    if (location) {
        filter.productLocation = location;
    }



    try {
        const total = await Product.countDocuments(filter);
        // Fetch the products from the database using the constructed filter
        const products = await Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("productCategory");


        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Product retrived successfully",
            pagination: {
                page,
                limit,
                total,
            },
            data: products
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

