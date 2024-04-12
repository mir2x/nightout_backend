const Category = require("../models/category.model");
const sendResponse = require("../shared/sendResponse");
const ApiError = require("../errors/ApiError.js");
const httpStatus = require("http-status");
const catchAsync = require("../shared/CatchAsync.js");
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");

exports.cateogryAdd = catchAsync(async (req, res, next) => {





    const { categoryName } = req.body;

    const categoryExist = await Category.findOne({ categoryName: categoryName.toLowerCase()});

    if (categoryExist) {
        throw new ApiError(409, "Category already exist!");
    }
    
    const isExist = await User.findOne({ _id: req.user._id });
   
 
    if (isExist.role=="ADMIN" || isExist.role=="SUPER ADMIN") {
       


        if (!categoryName) {
            throw new ApiError(400, "All Field are required");
        }



        let categoryImageName = '';


        // Check if req.files.image exists and is an array
        if (req.files && req.files.categoryImage) {
            // Add public/uploads link to the image file
            categoryImageName = `/public/uploads/image/${req.files.categoryImage[0].filename}`;

        }


        const category = await Category.create({

            categoryName: categoryName.toLowerCase(),

            categoryImage: categoryImageName
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Category add successfully",
        });


    } else {
        throw new ApiError(401, "You are unathorized");
    }






});
