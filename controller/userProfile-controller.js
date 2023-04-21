require("dotenv").config()
const Joi = require('@hapi/joi');
const _ = require('lodash');
const { validateMobileNumber, userTypeArr, validatePincode, validatePassword, validateUserType, getStateIdFromCountry } = require("../utils/custom-validators");
const AdminProfile = require("../models/superAdminModel");
const { default: mongoose } = require("mongoose");
const UserProfile = require("../models/userProfile-model");
const CommonUsers = require("../models/common-user-model");
const bcrypt = require("bcryptjs");
const Subadminprofile = require("../models/subadminModel");
const { Paginate } = require("../utils/paginate");
const responseMessage = require('../utils/responseMessage')
const { sendResponse, errorResponse } = require("../utils/response");

exports.createAdminProfile = async (req, res) => {

    try {

        if (req.body) {

            const { error } = await validateSuperAdminDetails(req.body);

            if (error) return errorResponse(res, 400, responseMessage.request_invalid, error.message);

            const { firstName, lastName, email, userType, mobile, password, state, city, pincode, description, address, gender, status } = req.body;

            let userProfile = await AdminProfile.findOne({
                $or: [
                    { email: email }
                ]
            });

            if (userProfile) return errorResponse(res, 400, responseMessage.user_exist_already, responseMessage.errorMessage);

            let checkPassword = await validatePassword(password);

            if (!checkPassword) return errorResponse(res, 400, responseMessage.password_invalid, responseMessage.errorMessage);

            let check = validateMobileNumber(mobile);

            if (!check) return errorResponse(res, 400, responseMessage.mobile_num_invalid, responseMessage.errorMessage);

            const findUserType = validateUserType(userTypeArr, userType);

            if (!findUserType.status) return errorResponse(res, 400, responseMessage.user_role_invalid, responseMessage.errorMessage);

            if (findUserType.id !== 1) return errorResponse(res, 400, responseMessage.user_type_admin, responseMessage.errorMessage);

            let addAdminData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                mobile: mobile,
                userType: userType,
                userRole: findUserType.name,
                isEmailVerified: true,
                isGoogleUser: false,
                isUserProfileCreated: true,
                isAdminApproved: 'accepted',
            }

            let addExtraData = {
                ...addAdminData,
                country: "India",
                state: state,
                city: city,
                pincode: pincode,
                address: address,
                description: description,
                gender: gender,
                status: status
            }

            var states = await getStateIdFromCountry("India", state);

            (states) ? addExtraData["fipsCode"] = states.fipsCode : addExtraData["fipsCode"] = "";

            const newUserProfile = new AdminProfile(addExtraData);

            const savedUser = await newUserProfile.save();

            const salt = await bcrypt.genSalt(8);

            const hashPassword = await bcrypt.hash(password, salt);

            if (savedUser) {

                const userStoredInCommonCollection = new CommonUsers({
                    ...addAdminData,
                    password: hashPassword,
                });

                await userStoredInCommonCollection.save();

                return sendResponse(res, 200, responseMessage.user_created, savedUser);

            } else {
                return errorResponse(res, 400, responseMessage.user_not_create, responseMessage.errorMessage);
            }
        } else {
            return errorResponse(res, 400, responseMessage.request_invalid, responseMessage.errorMessage);
        }
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};


exports.createUserProfile = async (req, res) => {
    try {

        if (req.body) {

            const { error } = await validateUserProfileData(req.body);

            if (error) return errorResponse(res, 400, responseMessage.request_invalid, error.message);

            const { firstName, lastName, email, description, userType, mobile, country, state, gender, address, city, pincode, organisationName } = req.body;

            let userProfile = await UserProfile.findOne({
                $or: [
                    { email: email }
                ]
            });

            if (userProfile) return errorResponse(res, 400, responseMessage.user_exist_already, responseMessage.errorMessage);

            let check = validateMobileNumber(mobile);

            if (!check) return errorResponse(res, 400, responseMessage.mobile_num_invalid, responseMessage.errorMessage);

            let checkPincode = validatePincode(pincode);

            if (!checkPincode) return errorResponse(res, 400, responseMessage.pincode_invalid, responseMessage.errorMessage);

            const findUserType = validateUserType(userTypeArr, userType);

            if (!findUserType.status) return errorResponse(res, 400, responseMessage.user_role_invalid, responseMessage.errorMessage);

            let getUser = await CommonUsers.findOne({
                $or: [
                    { email: email }
                ]
            });

            const getOrganisation = await Subadminprofile.findOne({ organisationName: organisationName });

            if (!getOrganisation) return errorResponse(res, 404, responseMessage.org_not_found, responseMessage.errorMessage);

            if (!getUser.isEmailVerified) return errorResponse(res, 400, responseMessage.email_not_verified, responseMessage.errorMessage);

            if (!getUser) {

                return errorResponse(res, 400, responseMessage.email_not_register, responseMessage.errorMessage);

            } else {


                let createUserId;

                let checkId = true;

                do {

                    createUserId = Math.floor(Math.random() * 90000) + 10000;

                    const checkIfIdPresentInDb = await UserProfile.findOne({ usersId: createUserId });

                    (checkIfIdPresentInDb) ? checkId = true : checkId = false;

                } while (checkId);

                const newUserProfile = new UserProfile({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    description: description,
                    mobile: mobile,
                    country: country,
                    state: state,
                    gender: gender,
                    address: address,
                    userType: userType,
                    userRole: findUserType.name,
                    city: city,
                    usersId: createUserId,
                    organisationName: organisationName,
                    organisationId: getOrganisation._id,
                    isUserProfileCreated: true,
                    isAdminApproved: 'pending',
                    pincode: pincode
                });

                var states = await getStateIdFromCountry(country, state);

                if (states) newUserProfile["fipsCode"] = states.fipsCode;

                const savedUser = await newUserProfile.save();

                if (getUser) {
                    getUser.userProfile = mongoose.Types.ObjectId(savedUser._id);
                    getUser.isUserProfileCreated = true;
                    await getUser.save();
                }
                if (savedUser) {

                    return sendResponse(res, 200, responseMessage.user_profile_create, newUserProfile);

                } else {

                    return errorResponse(res, 400, responseMessage.request_invalid, responseMessage.errorMessage);
                }
            }
        } else {

            return errorResponse(res, 400, responseMessage.user_profile_not_create, responseMessage.errorMessage);

        }
    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
}

exports.getUserProfile = async (req, res) => {
    try {

        let getUserProfileId = req.params.id;

        const userProfile = await CommonUsers.findById(getUserProfileId);

        if (!userProfile) {

            return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);

        }

        let isUserEnable = (userProfile.enabled !== undefined) ? userProfile.enabled : true;

        if (!isUserEnable) return errorResponse(res, 400, responseMessage.user_not_active, responseMessage.errorMessage);

        let userDetail = {};

        switch (userProfile.userType) {

            case 1:
                const adminUser = await AdminProfile.findOne({ email: userProfile.email })
                if (!adminUser) {
                    return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
                } else {
                    userDetail = { user: adminUser, userId: getUserProfileId }
                    return sendResponse(res, 200, responseMessage.user_profile_get, userDetail);
                }
            case 2:
                const subadminUser = await Subadminprofile.findOne({ email: userProfile.email })
                if (!subadminUser) {
                    return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
                } else {
                    userDetail = { user: subadminUser, userId: getUserProfileId }
                    return sendResponse(res, 200, responseMessage.user_profile_get, userDetail);
                }
            case 4:
            case 5:
                const user = await UserProfile.findOne({ email: userProfile.email })
                if (!user) {
                    return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
                } else {
                    userDetail = { user: user, userId: getUserProfileId }
                    return sendResponse(res, 200, responseMessage.user_profile_get, userDetail);
                }
            default:
                return errorResponse(res, 400, responseMessage.user_type_invalid, responseMessage.errorMessage);
        }
    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
};

exports.getAllUserProfile = async (req, res) => {

    try {
        const { page, limit, skip, sortOrder } = await Paginate(req);
        let query = {};
        const totalCounts = await UserProfile.countDocuments(query);
        const totalPages = Math.ceil(totalCounts / limit);
        const userProfile = await UserProfile.find({})
            .sort(sortOrder)
            .skip(skip).limit(limit);

        // check user if found or not 
        if (!userProfile) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);
        // check user is enabled
        // if (!userProfile.enabled) return res.status(400).send({ statusCode: 400, error: 'Invalid Reqeust', message: 'user is not in active state. Please contact admin to enable user' });
        // send data to client
        return sendResponse(res, 200, responseMessage.user_profile_list, { userProfile, page, totalCounts, totalPages });

    } catch (error) {

        return errorResponse(res, 500, responseMessage.errorMessage, error.message);

    }
};

exports.updateUserProfile = async (req, res) => {
    try {

        if (req.body.id) {

            let states;

            const { error } = validateUpdateUser(req.body);

            if (error) return errorResponse(res, 400, responseMessage.request_invalid, error.message);

            const { firstName, lastName, gender, description, country, state, city, pincode, address, id } = req.body;

            let checkPincode = validatePincode(pincode);

            if (!checkPincode) return errorResponse(res, 400, responseMessage.pincode_invalid, responseMessage.errorMessage);

            if (country.length && state.length !== 0) {
                states = await getStateIdFromCountry(country, state);
            }

            const userUpdate = await CommonUsers.findById(id)
            // .select('_id firstName lastName enabled mobile isUpdatedAt');
            if (!userUpdate) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);


            (firstName && firstName.length != 0) ? userUpdate.firstName = firstName : userUpdate.firstName;
            (lastName && lastName.length != 0) ? userUpdate.lastName = lastName : userUpdate.lastName;
            userUpdate.updatedAt = Date.now();

            await userUpdate.save();

            let inputData = {
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                description: description,
                country: country,
                state: state,
                fipsCode: states.fipsCode,
                city: city,
                pincode: pincode,
                address: address,
                updatedAt: Date.now()
            }
            let userDetail = {};

            switch (userUpdate.userType) {
                case 1:
                    const adminUser = await AdminProfile.findOneAndUpdate({ email: userUpdate.email }, inputData, { new: true })
                    if (!adminUser) {
                        return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
                    } else {
                        userDetail = { updatedUser: adminUser, userId: userUpdate._id }
                        return sendResponse(res, 200, responseMessage.user_profile_update, userDetail);
                    }
                case 2:
                    const subadminUser = await Subadminprofile.findOneAndUpdate({ email: userUpdate.email }, inputData, { new: true })
                    if (!subadminUser) {
                        return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
                    } else {
                        userDetail = { updatedUser: subadminUser, userId: userUpdate._id }
                        return sendResponse(res, 200, responseMessage.user_profile_update, userDetail);
                    }
                case 4:
                case 5:
                    const userStudent = await UserProfile.findOneAndUpdate({ email: userUpdate.email }, inputData, { new: true })
                    if (!userStudent) {
                        return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
                    } else {
                        userDetail = { updatedUser: userStudent, userId: userUpdate._id }
                        return sendResponse(res, 200, responseMessage.user_profile_update, userDetail);
                    }
                default:
                    return errorResponse(res, 400, responseMessage.user_type_invalid, responseMessage.errorMessage);
            }

        } else {
            return errorResponse(res, 400, responseMessage.request_invalid, responseMessage.errorMessage);
        }

    } catch (error) {
        return errorResponse(res, 500, responseMessage.errorMessage, error.message);
    }
}



async function validateUserProfileData(userProfileBody) {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(3).max(50).trim().required(),
            lastName: Joi.string().min(3).max(50).trim().required(),
            gender: Joi.string().min(3).trim().required(),
            mobile: Joi.string().min(10).max(10).required(),
            email: Joi.string().min(5).trim().max(50).email().required(),
            address: Joi.string().min(3).trim().required(),
            country: Joi.string().min(3).trim(),
            state: Joi.string().min(3).trim().required(),
            city: Joi.string().min(3).trim().required(),
            pincode: Joi.string().min(6).max(6).required(),
            userType: Joi.number().required(),
            description: Joi.string().allow(''),
            organisationName: Joi.string().trim().min(2).max(50).required()
        })
        return schema.validate(userProfileBody);
    } catch (err) {
        console.log(err);
    }
}

async function validateSuperAdminDetails(superAdminBody) {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(3).max(50).trim().required(),
            lastName: Joi.string().min(3).max(50).trim().required(),
            mobile: Joi.string().min(10).max(10).required(),
            email: Joi.string().min(5).trim().max(50).email().required(),
            password: Joi.string().trim().min(8).max(20).required(),
            userType: Joi.number().required(),
            gender: Joi.string(),
            status: Joi.string(),
            address: Joi.string(),
            state: Joi.string().min(3).max(100).trim().required(),
            pincode: Joi.string().min(6).max(6).trim().required(),
            city: Joi.string().min(3).max(100).trim().required(),
            description: Joi.string().allow('')
        })
        return schema.validate(superAdminBody);
    } catch (error) {
        console.log(err);
    }
}

async function validateUpdateUser(updateUserBody) {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(3).max(50).trim().required(),
            lastName: Joi.string().min(3).max(50).trim().required(),
            gender: Joi.string().min(3).trim().required(),
            address: Joi.string().min(3).trim().required(),
            state: Joi.string().min(3).trim().required(),
            city: Joi.string().min(3).trim().required(),
            pincode: Joi.string().min(6).max(6).required(),
            description: Joi.string().allow(''),
            id: Joi.string()
        })
        return schema.validate(updateUserBody);
    } catch (err) {
        console.log(err);
    }
}
