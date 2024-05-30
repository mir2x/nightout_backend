const Category = require("../models/category.model");
const sendResponse = require("../shared/sendResponse");
const ApiError = require("../errors/ApiError.js");
const httpStatus = require("http-status");
const catchAsync = require("../shared/CatchAsync.js");
const fs = require("fs");
const path = require("path");
const User = require("../models/user.model");

exports.categoryAdd = catchAsync(async (req, res, next) => {

   const { categoryName,someExtraField } = req.body;

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
            categoryImageName = `public/uploads/images/${req.files.categoryImage[0].filename}`;

        }
        


        const category = await Category.create({

            categoryName: categoryName.toLowerCase(),
            categoryImage: categoryImageName,
            someExtraField: someExtraField
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


exports.allCategoryShow = catchAsync(async (req, res, next) => {

        const category = await Category.find();

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Category retrived successfully",
            data:category
        });

});


exports.categoryById = catchAsync(async (req, res, next) => {


    const {id} = req.params;

   
    
    const isExist = await User.findOne({ _id: req.user._id });

    if (isExist.role == "ADMIN" || isExist.role == "SUPER ADMIN") {


        const category = await Category.findOne({ _id: id });
        if(category){
           
            
            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Category retrive successfully",
                data:category
    
            });
        }else{
            throw new ApiError(404, "Not found");
        }
        
        


    } else {
        throw new ApiError(401, "You are unathorized");
    }

    
  });


exports.categoryDelete = catchAsync(async (req, res, next) => {


    const { id } = req.params;



    const isExist = await User.findOne({ _id: req.user._id });

    if (isExist.role == "ADMIN" || isExist.role == "SUPER ADMIN") {


        const category = await Category.deleteOne({ _id: id });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Category delete successfully",
            data: category

        });


    } else {
        throw new ApiError(401, "You are unathorized");
    }


});

exports.categoryUpdate = catchAsync(async (req, res, next) => {


    const { id } = req.params;



    const isExist = await User.findOne({ _id: req.user._id });

    if (isExist.role == "ADMIN" || isExist.role == "SUPER ADMIN") {


        const existingDocument = await Category.findById(id);

        if (existingDocument) {
            const updateData = req.body;



            let categoryImageName = '';


            // Check if req.files.image exists and is an array
            if (req.files && req.files.categoryImage) {
                fs.unlinkSync(existingDocument.categoryImage);

                categoryImageName = `public/uploads/images/${req.files.categoryImage[0].filename}`;

            }

            updateData.categoryImage = categoryImageName ? categoryImageName: existingDocument.categoryImage;

            const category = await Category.findOneAndUpdate({ _id: id }, updateData, { new: true });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Category updated successfully",
                data: category

            });

        } else {
            throw new ApiError(404, "Category not found");
        }
      } else {
        throw new ApiError(401, "You are unathorized");
    }


});