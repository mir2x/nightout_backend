const paginationCalculate = (options) => {
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 1);

    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
};

module.exports = paginationCalculate;