const Subadminprofile = require("../models/subadminModel");
const Joi = require('@hapi/joi');
const _ = require('lodash');
const { userTypeArr, validateMobileNumber, validateUserType, validatePassword, getStateIdFromCountry, validatePincode } = require("../utils/custom-validators");
const CommonUsers = require("../models/common-user-model");
const bcrypt = require("bcryptjs");
const UserProfile = require("../models/userProfile-model");
const { Paginate } = require("../utils/paginate");
const responseMessage = require('../utils/responseMessage')
const { sendResponse, errorResponse } = require("../utils/response")

exports.createSubadminProfile = async (req, res) => {

    try {

        const { error } = validateSubadminDetails(req.body);

        if (error) return errorResponse(res, 400, responseMessage.request_invalid, error.message);

        const { firstName, lastName, email, userType, mobile, pincode, password, organisationName } = req.body;

        let check = validateMobileNumber(mobile);

        if (!check) return errorResponse(res, 400, responseMessage.mobile_num_invalid, responseMessage.errorMessage);

        const findUserType = validateUserType(userTypeArr, userType);

        if (!findUserType.status && findUserType.id !== 2) return errorResponse(res, 400, responseMessage.user_role_invalid, responseMessage.errorMessage);

        let checkPassword = await validatePassword(password);

        if (!checkPassword) return errorResponse(res, 400, responseMessage.password_invalid, responseMessage.errorMessage);

        let checkPincode = validatePincode(pincode);

        if (!checkPincode) return errorResponse(res, 400, responseMessage.pincode_invalid, responseMessage.errorMessage);

        let user = await Subadminprofile.findOne({
            $or: [
                { email: req.body.email }
            ]
        });

        if (user) return errorResponse(res, 400, responseMessage.user_already_register, responseMessage.errorMessage);

        let findCommonUser = await CommonUsers.findOne({
            $or: [
                { email: req.body.email }
            ]
        });

        if (findCommonUser) return errorResponse(res, 400, responseMessage.user_already_register, responseMessage.errorMessage);

        let createClientId;

        let checkId = true;

        do {

            createClientId = Math.floor(Math.random() * 90000) + 10000;

            const checkIfIdPresentInDb = await Subadminprofile.findOne({ clientId: createClientId });

            (checkIfIdPresentInDb) ? checkId = true : checkId = false;
            
        } while (checkId);

        const newUser = new Subadminprofile({
            ...req.body,
            gender: "others",
            isUserProfileCreated: true,
            isEmailVerified: true,
            userRole: findUserType.name,
            clientId: createClientId,
            description: req.body.description,
            isAdminApproved: "accepted"
        });

        var states = await getStateIdFromCountry("India", req.body.state);

        if (states) newUser["fipsCode"] = states.fipsCode;

        const savedUser = await newUser.save();

        const salt = await bcrypt.genSalt(8);

        const hashPassword = await bcrypt.hash(password, salt);

        const userStoredInCommonCollection = new CommonUsers({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashPassword,
            mobile: mobile,
            userType: userType,
            userRole: findUserType.name,
            isUserProfileCreated: true,
            isEmailVerified: true,
            isGoogleUser: false,
            organisationName: organisationName,
            isAdminApproved: "accepted"
        });

        const savedFinalUser = await userStoredInCommonCollection.save();

        if (savedFinalUser) {
            return sendResponse(res, 200, responseMessage.client_profile_create, savedUser);
        } else {
            return errorResponse(res, 400, responseMessage.client_profile_not_create, responseMessage.errorMessage);
        }
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
}


exports.getOrganisationDetails = async (req, res) => {
    try {
        const subadminProfile = await Subadminprofile.find({}).select("_id organisationName");
        // check user if found or not 
        if (!subadminProfile) return errorResponse(res, 400, responseMessage.org_list_not_found, responseMessage.errorMessage);
        // check user is enabled
        // if (!subadminProfile.enabled) return res.status(400).send({ statusCode: 400, error: 'Invalid Reqeust', message: 'Subadmin is not in active state. Please contact admin to enable subadmin' });
        // send data to client
        return sendResponse(res, 200, responseMessage.org_list_get, subadminProfile);
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};

exports.getSubadminProfile = async (req, res) => {
    try {
        // get the user data from database
        let subadminId = req.params.id;
        const subadminProfile = await Subadminprofile.findOne({ _id: subadminId })
        // check user if found or not 
        if (!subadminProfile) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);
        // check user is enabled
        // if (!subadminProfile.enabled) return res.status(400).send({ statusCode: 400, error: 'Invalid Reqeust', message: 'Subadmin is not in active state. Please contact admin to enable subadmin' });
        // send data to client
        return sendResponse(res, 200, responseMessage.user_profile_get, subadminProfile);
    } catch (error) {
        //send 500 error if something goes wrong 
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
}

exports.updateSubadminProfile = async (req, res) => {

    try {

        const requestBody = req.body;
        const requestId = req.params.id;
        const updateSubadmin = Subadminprofile.findOneAndUpdate({ _id: requestId }, requestBody, { new: true });

        if (!updateSubadmin) return errorResponse(res, 400, responseMessage.client_profile_not_found, responseMessage.errorMessage);

        return sendResponse(res, 200, responseMessage.client_profile_update, updateSubadmin);

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}

exports.removeSubadminProfile = async (req, res) => {

    try {

        let subadminId = req.params.id;

        const subadminProfile = await Subadminprofile.findOne({ _id: subadminId })
        // check user if found or not 
        if (!subadminProfile) return errorResponse(res, 400, responseMessage.client_profile_not_found, responseMessage.errorMessage);

        const result = await subadminProfile.deleteOne({ _id: subadminId })
        // send data to client
        return sendResponse(res, 200, responseMessage.client_profile_delete, result);

    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
}

exports.getAllSubadminProfile = async (req, res) => {
    try {
        const { page, limit, skip, sortOrder } = await Paginate(req);
        let query = {};
        const totalCounts = await Subadminprofile.countDocuments(query);
        const totalPages = Math.ceil(totalCounts / limit);
        const subadminProfile = await Subadminprofile.find({})
            .sort(sortOrder)
            .skip(skip).limit(limit);
        // check user if found or not 
        if (!subadminProfile) return errorResponse(res, 400, responseMessage.client_profile_not_found, responseMessage.errorMessage);
        // check user is enabled
        // if (!subadminProfile.enabled) return res.status(400).send({ statusCode: 400, error: 'Invalid Reqeust', message: 'Subadmin is not in active state. Please contact admin to enable subadmin' });
        // send data to client
        return sendResponse(res, 200, responseMessage.client_profile_get, { subadminProfile, page, totalCounts, totalPages });

    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}

exports.userStatus = async (req, res) => {

    try {

        if (req.body.status) {

            const user = await Subadminprofile.findByIdAndUpdate({ _id: req.params.id }, { status: req.body.status }, { new: true })

            if (!user) return errorResponse(res, 400, responseMessage.client_profile_not_found, responseMessage.errorMessage);

            return sendResponse(res, 200, responseMessage.client_status_change, user);

        }

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
};


exports.acceptOrReject = async (req, res) => {

    try {

        const { id, status } = req.body;

        const userData = await UserProfile.findById(id);

        if (!userData) return errorResponse(res, 400, responseMessage.client_profile_not_found, responseMessage.errorMessage);

        const updatedUser = await UserProfile.findByIdAndUpdate(id, { isAdminApproved: status }, { new: true });

        await CommonUsers.findOneAndUpdate({ email: userData.email }, { isAdminApproved: status }, { new: true });

        return sendResponse(res, 200, responseMessage.client_profile_approved_by_admin, updatedUser);

    }
    catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}

function validateSubadminDetails(subadminBody) {
    try {
        const schema = Joi.object({
            email: Joi.string().min(5).trim().max(255).email().required(),
            mobile: Joi.string().min(10).max(10).required(),
            firstName: Joi.string().min(2).max(50).trim().required(),
            lastName: Joi.string().min(2).max(50).trim().required(),
            address: Joi.string().min(2).max(50).trim().required(),
            state: Joi.string().min(2).max(50).trim().required(),
            city: Joi.string().min(2).max(50).trim().required(),
            userType: Joi.number().required(),
            status: Joi.string().trim().required(),
            pincode: Joi.string().trim().min(6).max(6).required(),
            organisationName: Joi.string().min(2).max(500).required(),
            password: Joi.string().trim().min(8).max(20).required(),
        })
        return schema.validate(subadminBody);
    } catch (err) {
        console.log(err);
    }
}