const ApiError = require("../errors/ApiError");
const handleValidationError = require("../errors/handleValidationError");
const handleValidation = require("../errors/handleValidationError");

const globalErrorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorMessages = [];

  console.log("globalErrorHandler ~~", error.message);

  if (error instanceof ApiError) {
    // Custom application errors
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error?.name === "ValidationError") {
    // Mongoose validation errors
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Error) {
    // General errors
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error.message,
      },
    ];
  }

  ///////////////////////////////////

  // if (error?.name === "ValidationError") {
  //     const simplifiedError = handleValidationError(error);
  //     statusCode = simplifiedError.statusCode;
  //     message = simplifiedError.message;
  //     errorMessages = simplifiedError.errorMessages;
  // } else if (error instanceof Error) {
  //     (message = error?.message),
  //         (errorMessages = error?.message
  //             ? [
  //                 {
  //                     path: "",
  //                     message: error?.message,
  //                 },
  //             ]
  //             : []);
  // } else if (error instanceof ApiError) {
  //     statusCode = error?.statusCode;
  //     (message = error?.message),
  //         (errorMessages = error?.message
  //             ? [
  //                 {
  //                     path: "",
  //                     message: error?.message,
  //                 },
  //             ]
  //             : []);
  // }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
  });
};

module.exports = globalErrorHandler;
