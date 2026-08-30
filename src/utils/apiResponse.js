const success = (res, data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
};

module.exports = { success };