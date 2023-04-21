require("dotenv").config()

const sendResponse = (res, statusCode, message, data) => {
    return res.status(statusCode).json({ statusCode: statusCode, success: true, message: message, details: data });
};

const errorResponse = (res, statusCode, message, error) => {
    return res.status(statusCode).json({ statusCode: statusCode, success: false, message: message, error: error });
};

module.exports = { sendResponse, errorResponse }
