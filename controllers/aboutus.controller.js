const ApiError = require("../errors/ApiError.js");
const catchAsync = require("../shared/CatchAsync.js");
const pick = require("../shared/pick.js");
const About = require("../models/aboutus.model.js");
const sendResponse = require("../shared/sendResponse");
const httpStatus = require("http-status");
const path = require("path");

exports.aboutus=catchAsync(async (req, res, next) => {


    const { aboutUs } = req.body

    if (req.user.role == "ADMIN" || "SUPER ADMIN" ) {
       
        let aboutus = await About.findOne();

        if(!aboutus){
            const aboutus = new About({
                aboutUs
            });

            await aboutus.save();

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "About us add successfully",
            });
    
        }else{
            aboutus.aboutUs=aboutUs
            await aboutus.save();

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "About us updated successfully",
            });

        }

    }else{
        throw new ApiError(401, "You are unathorized"); 
    }

});

exports.aboutusFetch=catchAsync(async (req, res, next) => {

    let aboutus = await About.findOne();
    if(aboutus){
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Data get successfully",
            data:aboutus
        });
    }else{
        throw new ApiError(404, "Don't have any data in aboutus"); 
        
        
    }  

});
