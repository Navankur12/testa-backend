const mongoose = require('mongoose');

const commonUsersSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true
    },
    password:{
        type:String,
        required:false
    },
    userType: {
        type: Number,
        required: true
    },
    userRole: {
        type: String,
        required: false
    },
    isGoogleUser:{
        type:Boolean,
        default:false
    },
    isEmailVerified:{
        type:Boolean,
    },
    organisationName:{
        type:String,
    },
    acceptTermCondition:{
        type:Boolean
    },
    organisationId:{
        type:mongoose.Types.ObjectId,
        ref:"Subadminprofile"
    },
    isUserProfileCreated:{
        type:Boolean,
    },
    isAdminApproved:{
        type:String,
        enum:['accepted','rejected','pending']
    },
    adminProfile:{
        type:mongoose.Types.ObjectId,
        ref:"AdminProfile"
    },
    userProfile:{
        type:mongoose.Types.ObjectId,
        ref:"UserProfile"
    },
    enabled:{
        type:Boolean,
        default:true
    },
    isTourComplete:{
        type:Boolean,
        default:false
    },
}, {
    timestamps: true
});

const Subadminprofile = mongoose.model('CommonUsers', commonUsersSchema);

module.exports = Subadminprofile;