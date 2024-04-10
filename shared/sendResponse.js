const sendResponse = (res, data) => {
    const responseData = {
        statusCode: data.statusCode,
        status: data.success,
        message: data.message,
        pagination: data.pagination,
        data: data.data,
        token: data.token
    };

    return res.status(data.statusCode).json(responseData);
};

module.exports = sendResponse;