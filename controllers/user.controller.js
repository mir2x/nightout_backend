const User = require("../models/user.model");
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
const Product = require("../models/product.model");

exports.userRegister = catchAsync(async (req, res, next) => {
    
    const { fullName, email, password, confirmPass, termAndCondition, role, mobileNumber,location } =
        req.body;

    if (!fullName || !email || !password || !confirmPass || !termAndCondition || !mobileNumber || !location) {
        throw new ApiError(400, "All Field are required");
    }

    const isExist = await User.findOne({ email: email });

    if(isExist && isExist.emailVerified==false){
        const emailVerifyCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        isExist.emailVerifyCode=emailVerifyCode;
        await isExist.save();
        const emailData = {
            email,
            subject: "Account Activation Email",
            html: `
                    <h1>Hello, ${isExist?.fullName}</h1>
                    <p>Your email verified code is <h3>${emailVerifyCode}</h3> to verify your email</p>
                    <small>This Code is valid for 3 minutes</small>
                  `,
        };
    
        emailWithNodemailer(emailData);

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Please check your E-mail to verify your account.",
        });


    }
    if (isExist && isExist.emailVerified==true) {
        throw new ApiError(409, "Email already exist!Please login.");
    }

    if (password !== confirmPass) {
        throw new ApiError(400, "Password and confirm password does not match");
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // let imageFileName = "";
    // if (req.files && req.files.image && req.files.image[0]) {
    //     imageFileName = `/media/${req.files.image[0].filename}`;
    // }

    const emailVerifyCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    const user = await User.create({
        fullName,
        email,
        password: hashPassword,
        termAndCondition: JSON.parse(termAndCondition),
        emailVerifyCode,
        mobileNumber,
        
        location,
        role: role?role:"USER",
        image:"https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg?size=626&ext=jpg&ga=GA1.1.1700460183.1708560000&semt=sph"
         
    });

    if (userTimers.has(user?._id)) {
        clearTimeout(userTimers.get(user?._id));
    }
    const userTimer = setTimeout(async () => {
        try {
            user.oneTimeCode = null;
            await user.save();
            // Remove the timer reference from the map
            userTimers.delete(user?._id);
        } catch (error) {
            console.error(
                `Error updating email verify code for user ${user?._id}:`,
                error
            );
        }
    }, 180000); // 3 minutes in milliseconds

    // Store the timer reference in the map
    userTimers.set(user?._id, userTimer);

    const emailData = {
        email,
        subject: "Account Activation Email",
        html: `
                <h1>Hello, ${user?.fullName}</h1>
                <p>Your email verified code is <h3>${emailVerifyCode}</h3> to verify your email</p>
                <small>This Code is valid for 3 minutes</small>
              `,
    };

    emailWithNodemailer(emailData);
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Register successfully! Please check your E-mail to verify.",
    });
});



exports.verifyEmail = catchAsync(async (req, res, next) => {
    const { emailVerifyCode, email } = req.body;

    if (!emailVerifyCode && !email) {
        throw new ApiError(400, "All Field are required");
    }

    const user = await User.findOne({ email: email });
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    if (user.emailVerifyCode !== emailVerifyCode) {
        throw new ApiError(410, "OTP Don't matched");
    }

    user.emailVerified = true;
    user.emailVerifyCode = null;
    
    await user.save();
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Email Verified Successfully",
    });
});

exports.userLogin = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    if (!password && !email) {
        throw new ApiError(400, "All Field are required");
    }

    const user = await User.findOne({ email: email });
    if (!user) {
        throw new ApiError(204, "User not Found");
    }

    if (user.emailVerified === false) {
        throw new ApiError(401, "your email is not verified");
    }

    if(user.status=="DELETE"){
        throw new ApiError(401, "Unauthorized user");  
    }

    if(user.status=="BLOCK"){
        throw new ApiError(401, "Your account has been blocked by admin");  
    }

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
        throw new ApiError(401, "your credential doesn't match");
    }

    const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
        expiresIn: "3d",
    });
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your Are logged in successfully",
        //data: user,
        token: token,
        data:user
    });
});

exports.loggedUserData=catchAsync(async (req, res) => {

    const user = await User.findById(req.user._id);

    if(user){
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Logged user data retrived successfully",
            data:user
        }); 
    }else{
        throw new ApiError(401, "You are unauthorized"); 
    }
    
});


exports.forgotPassword = catchAsync(async (req, res, next) => {
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "User doesn't exists");
    }

    // Store the OTC and its expiration time in the database
    const emailVerifyCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    user.emailVerifyCode = emailVerifyCode;
    user.emailVerified = false;
    await user.save();

    // Prepare email for password reset
    const emailData = {
        email,
        subject: "Password Reset Email",
        html: `
        <h1>Hello, ${user.fullName}</h1>
        <p>Your Email verified Code is <h3>${emailVerifyCode}</h3> to reset your password</p>
        <small>This Code is valid for 3 minutes</small>
      `,
    };

    // Send email
    try {
        await emailWithNodemailer(emailData);
    } catch (emailError) {
        console.error("Failed to send verification email", emailError);
    }

    // Set a timeout to update the oneTimeCode to null after 1 minute
    setTimeout(async () => {
        try {
            user.emailVerifyCode = null;
            await user.save();
            console.log("emailVerifyCode reset to null after 3 minute");
        } catch (error) {
            console.error("Error updating EmailVerifyCode:", error);
        }
    }, 180000); // 3 minute in milliseconds

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Send email Verify Code Successfully",
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        throw new ApiError(400, "User doesn't exists");
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "Password and confirm password doesn't match");
    }

    if (user.emailVerified === true) {
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        user.password = hashpassword;
        user.emailVerifyCode = null;
        await user.save();

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Password Updated Successfully",
            data: user,
        });
    } else {
        throw new ApiError(400, "Your email is not verified");
    }
});



exports.changePassword = catchAsync(async (req, res) => {
    const { currentPass, newPass, confirmPass } = req.body;
    const user = await User.findById(req.user._id);

    if (!currentPass || !newPass || !confirmPass) {
        throw new ApiError(400, "All Fields are required");
    }

    const ismatch = await bcrypt.compare(currentPass, user.password);
    if (!ismatch) {
        throw new ApiError(400, "Current Password is Wrong");
    }

    if (currentPass == newPass) {
        throw new ApiError(400, "New password cannot be the same as old password");
    }

    if (newPass !== confirmPass) {
        throw new ApiError(400, "password and confirm password doesnt match");
    }

    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(newPass, salt);
    await User.findByIdAndUpdate(req.user._id, {
        $set: { password: hashpassword },
    });

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password Changed Successfully",
    });
});

exports.deleteAccountByMe = catchAsync(async (req, res, next) => {
    
    const user = await User.findById(req.user._id);
    user.status = "DELETE";
    await user.save();
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Account Delete Successfully",
    });
});


exports.blockAccountByAdmin = catchAsync(async (req, res, next) => {

    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (user.role == "SUPER ADMIN") {
        const deleteuser = await User.findById(id);
        deleteuser.status = "BLOCK";
        await deleteuser.save();
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Account Blocked Successfully",
        });
    } else {
        throw new ApiError(401, "You are Unathorized user"); 
    }
   
   
});


exports.activeAccountByAdmin = catchAsync(async (req, res, next) => {

    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (user.role == "SUPER ADMIN" || "ADMIN") {
        const activeuser = await User.findById(id);
        activeuser.status = "ACTIVE";
        await activeuser.save();
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Account Actived Successfully",
        });
    } else {
        throw new ApiError(401, "You are Unathorized user"); 
    }
   
});


exports.allUsers=catchAsync(async (req, res, next) => {
    
    const user = await User.find({emailVerified:true});
    
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All users retrive Successfully",
        data:user
    });
});



exports.allStatusData=catchAsync(async (req, res, next) => {


    //total seller
    const distinctUserIds = await Product.distinct('userId');
    const totalSellerCount = distinctUserIds.length;
    




  // this month seller 
   const startOfMonth = new Date();
   startOfMonth.setDate(1);
   startOfMonth.setHours(0, 0, 0, 0);

   const endOfMonth = new Date();
   endOfMonth.setMonth(startOfMonth.getMonth() + 1);
   endOfMonth.setDate(1);
   endOfMonth.setHours(0, 0, 0, 0);

   // Use Mongoose aggregation to count users who created their account this month and own at least one product
   const pipeline1 = [
       {
           // Filter for users who created their account this month
           $match: {
               createdAt: {
                   $gte: startOfMonth,
                   $lt: endOfMonth,
               },
           },
       },
       {
           // Join with the products collection to find users who own products
           $lookup: {
               from: 'products', // Collection name in the database
               localField: '_id',
               foreignField: 'userId',
               as: 'products',
           },
       },
       {
           // Filter for users who have at least one product
           $match: {
               'products.0': { $exists: true },
           },
       },
       {
           // Group the results and count the distinct users
           $group: {
               _id: null,
               count: { $sum: 1 },
           },
       },
   ];

   // Execute the aggregation pipeline and get the count
   const results = await User.aggregate(pipeline1);
   const newSeller = results.length > 0 ? results[0].count : 0;




   //total-active-seller-count-who-has-product

   const pipeline = [
    {
        // Filter users who have active status
        $match: {
            status: 'ACTIVE',
        },
    },
    {
        // Join the Product collection to find users who own products
        $lookup: {
            from: 'products', // The collection name in the database
            localField: '_id',
            foreignField: 'userId',
            as: 'products',
        },
    },
    {
        // Filter only users who have at least one product
        $match: {
            'products.0': { $exists: true },
        },
    },
    {
        // Group and count the number of active users who own at least one product
        $group: {
            _id: null,
            count: { $sum: 1 },
        },
    },
];

// Execute the aggregation pipeline and get the count
const totalresults = await User.aggregate(pipeline);
const totalActiveSellerCount = totalresults.length > 0 ? totalresults[0].count : 0;



   res.json({ newSeller,totalSellerCount,totalActiveSellerCount});

});


exports.sellerCount = catchAsync(async (req, res, next) => {

    if (req.user.role == "ADMIN" || "SUPER ADMIN") {
        const initializeMonthlyCounts = () => ({
            jan: 0,
            feb: 0,
            mar: 0,
            apr: 0,
            may: 0,
            jun: 0,
            jul: 0,
            aug: 0,
            sep: 0,
            oct: 0,
            nov: 0,
            dec: 0,
        });
        // Get the optional year from the query string
        const { year } = req.query;

        // Determine the target year
        const currentYear = new Date().getFullYear();
        const targetYear = year ? parseInt(year, 10) : currentYear;

        // Perform aggregation query to get sellers count per month for the target year
        const sellersCount = await Product.aggregate([
            {
                // Join with the User collection to filter products based on account creation year
                $lookup: {
                    from: "users", // Assuming the User collection is called "users"
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                // Filter products based on user account creation year
                $match: {
                    // Ensure there is a user linked to the product
                    user: { $ne: [] },
                    // Ensure the account creation year matches the target year
                    "user.createdAt": {
                        $gte: new Date(targetYear, 0, 1), // Start of the target year
                        $lt: new Date(targetYear + 1, 0, 1), // Start of the next year
                    },
                },
            },
            {
                // Create fields for year and month
                $addFields: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
            },
            {
                // Group by year and month, and collect unique userId
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month",
                    },
                    uniqueSellers: { $addToSet: "$userId" },
                },
            },
            {
                // Calculate the count of unique sellers for each group
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    sellersCount: { $size: "$uniqueSellers" },
                },
            },
        ]);

        // Create a template for all months in the year with counts initialized to zero
        let monthlyCounts = initializeMonthlyCounts();

        // Update the monthly counts based on the query results
        sellersCount.forEach((item) => {
            // Map the months to their counts
            const monthName = new Date(2000, item.month - 1).toLocaleString("en-US", {
                month: "short",
            }).toLowerCase();
            monthlyCounts[monthName] = item.sellersCount;
        });

        // Create the final response object
        const response = {
            year: targetYear,
            month: monthlyCounts,
        };

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Total seller count for every year retrived successfully",
            data: response
        });
    } else {
        throw new ApiError(401, "You are Unathorized user"); 
    }

    
});
 


exports.topSellersList = catchAsync(async (req, res, next) => {
    const topSellingUsers = await Product.aggregate([
        {
            // Filter to include only sold products
            $match: {
                sold: true, // Filters for sold products
            },
        },
        {
            // Group by userId and count the number of sold products for each user
            $group: {
                _id: "$userId",
                soldCount: { $sum: 1 }, // Count of sold products for each user
            },
        },
        {
            // Sort the users by soldCount in descending order
            $sort: {
                soldCount: -1,
            },
        },
        {
            // Look up the User collection to get user details
            $lookup: {
                from: "users", // Collection to look up
                localField: "_id", // Field in the current collection (Product) to match
                foreignField: "_id", // Field in the User collection to match with localField
                as: "userDetails", // Alias for the user details array
            },
        },
        {
            // Unwind the userDetails array (to flatten the results)
            $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true, // Allow null or empty arrays
            },
        },
        {
            // Project the fields you want to include in the final output
            $project: {
                userId: "$_id",
                soldCount: 1,
                fullName: "$userDetails.fullName",
                email: "$userDetails.email",
                location: "$userDetails.location",
                // Add other user details you want to include (e.g., mobileNumber)
            },
        },
    ]);

    // Return the top-selling users as a JSON response
    res.json(topSellingUsers);

    
 });



 exports.profileUpdate=catchAsync(async (req, res) => {

    const{fullName,image,mobileNumber,location}=req.body
  

    const user = await User.findById(req.user._id);

    if(user){

        const updateData = { fullName, mobileNumber, location };

        if (req.files && req.files['image']) {
            let imageFileName = '';
            if (req.files.image[0]) {
                // Add public/uploads link to the image file


                imageFileName = `public/uploads/images/${req.files.image[0].filename}`;
                updateData.image=imageFileName
            }


        }
          
        let userData=await User.findByIdAndUpdate(req.user._id, updateData, { new: true });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Profile update successfully",
            data:userData
        });

    }else{
        throw new ApiError(401, "You are unauthorized");
    }

});





