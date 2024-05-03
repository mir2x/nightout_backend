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

    query.sold = false;

    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { limit, page, skip } = paginationCalculate(paginationOptions);

    let products = Product.find(query).skip(skip).limit(limit);

    products = products.populate("productCategory").sort({ createdAt: -1 });

    const productsDocument = await products.exec();
    const total = await Product.countDocuments({ sold: false });
    if (total == 0) {
        throw new ApiError(404, "Product not found");
    }   
    
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

    let product = await Product.findById(req.params.id).populate("productCategory");
    if (!product) {

        throw new ApiError(404, "Product not found");
    }

    const currentDate = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
    console.log(typeof currentDate)

    // Initialize userViews map if not present
    if (!product.userViews) {
        product.userViews = new Map();
    }


    // Check if the user has already viewed the product today
    const lastViewDate = product.userViews.get(req.user._id);

    console.log(typeof lastViewDate)

    const hasViewedToday = lastViewDate ? currentDate.toDateString() === new Date(lastViewDate).toDateString() : false;


    if (!hasViewedToday) {
        // Increment the popularity count
        product.popular += 1;

        // Update the userViews map with the current date
        product.userViews.set(req.user._id, currentDate);

        // Save the product
        await product.save();
    }
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
        productName: { $regex: req.body.productName, $options: 'i' }, sold: false,
    });



    if (products.length == 0) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Product not found!",
            data: null
        });
    }

    //await Product.findByIdAndDelete(req.params.id);

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
    filter.sold = false;
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



    
        const total = await Product.countDocuments(filter);
        // Fetch the products from the database using the constructed filter
        const products = await Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("productCategory");

    if (total == 0) {
        throw new ApiError(404, "Product not found");
    }

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

    

});


exports.feturedProduct = catchAsync(async (req, res, next) => {

   

    if (req.user.role == "ADMIN" || "SUPER ADMIN") {

        const findProduct = await Product.findOne({ _id: req.params.id });
        if (findProduct) {

            if (findProduct.featured == false) {
                const updateData = { featured: true }

                const product = await Product.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true });

                return sendResponse(res, {
                    statusCode: httpStatus.OK,
                    success: true,
                    message: "Product featured successfully",
                    data: product

                });
            } else {
                const updateData = { featured: false }

                const product = await Product.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true });

                return sendResponse(res, {
                    statusCode: httpStatus.OK,
                    success: true,
                    message: "Product remove from featured section successfully",
                    data: product

                });
            }

        }
        else {
            throw new ApiError(404, "Product not found");
        }


    } else {
        throw new ApiError(401, "You are unathorized user");
    }


});

exports.fetchFeaturedProduct=catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { limit, page, skip } = paginationCalculate(paginationOptions);


    let query = Product.find({featured:true,sold:false})
    .populate("productCategory")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    const productsDocument = await query.exec();
    const total = await Product.countDocuments({ featured:true,sold:false });

    if(total==0){
        throw new ApiError(404, "Featured products not found"); 
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Featured products retrived successfully",
        pagination: {
            page,
            limit,
            total
          
        },
        data: productsDocument

    });

    

});




exports.productWishlist = catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    const product = await Product.findById(req.params.id);

    if (!user) {
        throw new ApiError(401, "You are unathorized user");
    }

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const productIndex = user.wishlist.indexOf(product._id);
    if (productIndex > -1) {
        // Product is in the wishlist, remove it
        user.wishlist.splice(productIndex, 1);
        await user.save();

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "This product has been remove successfully from your wishlist",
            data: user.wishlist

        });

    } else {
        // Product is not in the wishlist, add it
        user.wishlist.push(product._id);

        await user.save();

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "This product has been added successfully from your wishlist",
            data: user.wishlist

        });
    }

    // Save the user


});


exports.fetchWishlistProduct=catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { limit, page, skip } = paginationCalculate(paginationOptions);


    let query = Product.find({ _id: { $in: user.wishlist },sold:false })
    .populate("productCategory")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    const productsDocument = await query.exec();
    const total = await Product.countDocuments({ _id: { $in: user.wishlist },sold:false });

    if(total==0){
        throw new ApiError(404, "Wishlist products not found"); 
    }
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My all wishlist product retrived successfully",
        pagination: {
            page,
            limit,
            total
          
        },
        data: productsDocument

    });


});


exports.productUpdate = catchAsync(async (req, res, next) => {

    const { id } = req.params;



    const isExist = await User.findOne({ _id: req.user._id });

    const product = await Product.findOne({ _id: id });
    console.log(req.user._id == product.userId)
    if (isExist && product.userId.toString() == req.user._id.toString()) {
        const existingProduct = await Product.findById(id);

        if (existingProduct) {
            const updateData = req.body;


            const publicImageUrl = [];

            if (req.files && req.files.productImage) {

                if (existingProduct.productImage) {
                    existingProduct.productImage.forEach((imagePath) => {
                        // Add code to delete the image file from the file system

                        fs.unlink(imagePath, (err) => {
                            if (err) {
                                console.error(`Error deleting image: ${imagePath}`, err);
                            }
                        });
                    });
                }


                req.files.productImage.forEach((file) => {
                    const productImageUrl = `public/uploads/images/${file.filename}`;
                    //const publicFileUrl = createFileDetails('kyc', file.filename)
                    publicImageUrl.push(productImageUrl);
                });
            }



            updateData.productImage = publicImageUrl ? publicImageUrl : existingProduct.productImage;

            const product = await Product.findOneAndUpdate({ _id: id }, updateData, { new: true });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Product updated successfully",
                data: product

            });
        } else {
            throw new ApiError(404, "Product not found");
        }


    } else {
        throw new ApiError(401, "You are unathorized user");
    }
});





exports.bannerProduct = catchAsync(async (req, res, next) => {

    if (req.user.role == "ADMIN" || "SUPER ADMIN") {

        const findProduct = await Product.findOne({ _id: req.params.id });
        if (findProduct) {

            if (findProduct.bannerProduct == false) {
                const updateData = { bannerProduct: true }

                const product = await Product.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true });

                return sendResponse(res, {
                    statusCode: httpStatus.OK,
                    success: true,
                    message: "This product has been added for banner successfully",
                    data: product

                });
            } else {
                const updateData = {bannerProduct: false }

                const product = await Product.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true });

                return sendResponse(res, {
                    statusCode: httpStatus.OK,
                    success: true,
                    message: "This product has been removed from banner section successfully",
                    data: product

                });
            }

        }
        else {
            throw new ApiError(404, "Product not found");
        }


    } else {
        throw new ApiError(401, "You are unathorized user");
    }


});


exports.fetchBannerProduct=catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const paginationOptions = pick(req.query, ["limit", "page"]);
    const { limit, page, skip } = paginationCalculate(paginationOptions);


    let query = Product.find({bannerProduct:true})
    .populate("productCategory")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    const productsDocument = await query.exec();
    const total = await Product.countDocuments({ bannerProduct:true });
    if(total==0){
        throw new ApiError(404, "Banner products not found"); 
    }
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Banner products retrived successfully",
        pagination: {
            page,
            limit,
            total
          
        },
        data: productsDocument

    });

    

});



exports.allSellerList=catchAsync(async (req, res, next) => {

    try {
        // Use Mongoose's aggregation to fetch users who have products
        const usersWithProducts = await User.aggregate([
            {
                $lookup: {
                    from: 'products', // Name of the products collection
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'products',
                },
            },
            {
                $match: {
                    'products.0': { $exists: true }, // Ensure user has at least one product
                },
            },
        ]);

        res.json(usersWithProducts);
    } catch (err) {
        console.error('Error fetching users with products:', err);
        res.status(500).json({ error: 'Internal server error' });
    }


});





