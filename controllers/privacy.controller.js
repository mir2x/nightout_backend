const ApiError = require("../errors/ApiError.js");
const catchAsync = require("../shared/CatchAsync.js");
const pick = require("../shared/pick.js");
const Privacy = require("../models/privacy.model.js");
const sendResponse = require("../shared/sendResponse");
const httpStatus = require("http-status");
const path = require("path");


exports.privacy=catchAsync(async (req, res, next) => {


    const { privacy } = req.body

    if (req.user.role == "ADMIN" || "SUPER ADMIN" ) {
       
        let privacyPolicy = await Privacy.findOne();
       

        if(!privacyPolicy){
            const privacypolicy = new Privacy({
                privacy
            });

            await privacypolicy.save();

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Privacy added successfully",
            });
    
        }else{
            privacyPolicy.privacy=privacy
            await privacyPolicy.save();

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Privacy updated successfully",
            });

        }

    }else{
        throw new ApiError(401, "You are unathorized"); 
    }

});

exports.privacyFetch=catchAsync(async (req, res, next) => {

    let privacy = await Privacy.findOne();
    if(privacy){
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Data get successfully",
            data:privacy
        });
    }else{
        throw new ApiError(404, "Don't have any data in privacy"); 
        
        
    }  

});
