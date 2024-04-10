const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../errors/ApiError.js");
exports.checkUser = async (req, res, next) => {
    const { authorization } = req.headers;
    let token;
    if (authorization && authorization.startsWith("Bearer")) {
        try {
            token = authorization.split(" ")[1];
            console.log("tushar", token);
            const { userID } = jwt.verify(token, process.env.JWT_SECRET)
            // console.log("tushar",mydata);
            req.user = await User.findById({ _id: userID }).select("-password")

            next()
        } catch (e) {
            console.log(e)
            return res.status(401).send({ "status": 401, "messege": "Unauthorized user" })

        }
    } if (!token) {
        return res.status(401).send({ "status": 401, "messege": "Unauthorized user. No token" })

    }
};