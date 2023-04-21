const { boolean, number } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  isGoogleUser: {
    type: Boolean,
    required: true,
    default: false
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false
  },
  organisationName:{
    type:String,
    required:true
  },
  userType: {
    type: Number,
    required: true,
  },
  userRole: {
    type: String,
    required: false
  },
  mobile: {
    type: String,
    required: true
  },
  acceptTermCondition: {
    type: Boolean,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
  },
  userDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userDetail"
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "role"
  },
  userProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserProfile"
  },
  organisationId:{
    type:mongoose.Types.ObjectId,
    ref:'Subadminprofile'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  isUserProfileCreated:{
    type:Boolean,
  },
  isAdminApproved:{
    type:String,
    enum:['accepted','rejected','pending']
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
