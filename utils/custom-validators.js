require("dotenv").config()
const { CountryState } = require("../models/country-city-model");
const logger = require("../middleware/logger");

const getStateIdFromCountry = async (country, getState) => {
    let allState = await CountryState.distinct("states", {
        "name": country
    });
    if (allState) {
        let getFipsCodeFromState = allState.find((list) => {
            if (list.name === getState) {
                return list;
            }
        });
        return getFipsCodeFromState;
    } else {
        return null;
    }
}

const validateMobileNumber = async (mobile) => {
    let pattern = /^[0-9]{10}$/;
    return pattern.test(mobile);
}

const validatePassword = async (password) => {
    let passPattern = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/
    return passPattern.test(password);
}

const validatePincode = async (pincode) => {
    let pinPattern = /^[0-9]{6}$/;
    return pinPattern.test(pincode);
}

const validateUserType = (userArr, userType) => {

    let findList = userArr.find((list) => {
        if (list.id === userType) {
            return list;
        }
    });

    let checkUserType = (findList !== undefined) ? true : false;

    if (checkUserType) {
        return {
            ...findList,
            status: true
        }
    } else {
        return {
            ...findList,
            status: false
        }
    }
}

const validateOtpValue = (inputOtp, existOtp) => {
    return (inputOtp !== existOtp) ? false : true;
};

const userTypeArr = [
    { id: 1, name: 'superadmin' },
    { id: 2, name: 'admin' },
    { id: 4, name: 'employee' },
    { id: 5, name: 'student' },
]

const getPaination = (req) => {

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip }
}

const getFilter = (req, searchOptions) => {

    const status = req.query.status ?? 'all';
    const search = req.query.search ?? '';
    const sortBy = req.query.sortBy ?? 'createdAt';
    const sortOrder = req.query.sortOrder ?? 'desc';
    const query = status === 'all' ? {} : { status: status };
    if (search) {
        query['$or'] = searchOptions.map(item => ({ [item]: { $regex: search, $options: 'i' } }))
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    return { sort, query }
}


const errorDetail = (error) => {
    message = error.message;
    const stackError = error.stack || '';
    const match = stackError.match(/at\s+.+\s+\((.+):(\d+):(\d+)\)/);
    const file = match ? match[1] : null;
    const line = match ? match[2] : null;
    const column = match ? match[3] : null;
    return { message, stackError, file, line, column }
}

const logError = (error) => {
    const { line, stack, message, file } = errorDetail(error)
    return logger.error({ line, stack, message, file });
}

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const weekNumber = [0, 1, 2, 3, 4, 5, 6];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

module.exports = {
    validateMobileNumber,
    validatePassword,
    userTypeArr,
    validatePincode,
    validateUserType,
    getStateIdFromCountry,
    validateOtpValue,
    getPaination,
    getFilter,
    logError,
    weekDays,
    months,
    weeks,
    weekNumber
}