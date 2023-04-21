require("dotenv").config()
const { JWT_SECRET, GOOGLE_MAIL_ID, GOOGLE_MAIL_PASSWORD, EMAIL_SERVICE,
  EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_FROM_ADDRESS,
  CLIENT_URL
} = require("../config/keys")
const UserDetails = require("../models/UserDetail")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const Joi = require("@hapi/joi");
const { validateMobileNumber, validatePassword, userTypeArr, validateUserType } = require("../utils/custom-validators");
const CommonUsers = require("../models/common-user-model");
const Subadminprofile = require("../models/subadminModel");
const sendMailToUser = require("../utils/send-mail");
const { sendResponse, errorResponse } = require("../utils/response");
const responseMessage = require("../utils/responseMessage")
// exports.singUp = async (req, res) => {
//     // let session = null;

//     try {
//         // session = await mongoose.startSession();
//         // session.startTransaction();

//         if (req.body.credential) {
//             const verificationResponse = await verifyGoogleToken(req.body.credential);
//             if (verificationResponse.error) {
//                 sendResponse(res, 400, false, null, verificationResponse.error, null, null);
//             }

//             const profile = verificationResponse?.payload;

//             const existsInDB = await User.findOne({ email: profile?.email })

//             if (existsInDB) {
//                 sendResponse(res, 400, true, null, 'User already exists with this email', null, null);
//             }

//             const newUserDetail = new UserDetails({
//                 preferredLanguage: 'en',
//                 isTourComplete: false,
//             });

//             const savedUserDetail = await newUserDetail.save();

//             const newUser = new User({
//                 // firstName: profile?.given_name,
//                 // lastName: profile?.family_name,
//                 fullName: `${profile?.given_name} ${profile?.family_name}`,
//                 email: profile?.email,
//                 isGoogleUser: true,
//                 isEmailVerified: true,
//                 acceptTermCondition: req.body.acceptTermCondition,
//                 userDetail: savedUserDetail._id
//             })

//             const savedUser = await newUser.save();

//             // await session.commitTransaction();

//             const userWithDetails = await User.findById(savedUser._id).populate("userDetail")

//             const responseData = {
//                 // firstName: userWithDetails.firstName,
//                 // lastName: userWithDetails.lastName,
//                 fullName: userWithDetails.fullName,
//                 email: userWithDetails.email,
//                 preferredLanguage: userWithDetails.userDetail.preferredLanguage,
//                 token: jwt.sign({ email: userWithDetails.email }, JWT_SECRET, {
//                     expiresIn: "1d",
//                 }),
//             }

//             sendResponse(res, 201, true, "Register was successful", null, responseData, null);
//         }


//     } catch (error) {

//         // if (!session) {
//         //     await session.abortTransaction();
//         // }
//         sendResponse(res, 500, false, null, `${error?.message || error}`, null, null);

//     }
//     // finally {
//     //     if (session) {
//     //         session.endSession();
//     //     }
//     // }
// }

exports.registerUser = async (req, res) => {
  try {

    if (req.body) {

      const { error } = validateRegisterData(req.body);

      if (error) return errorResponse(res, 400, responseMessage.request_invalid, error.message);

      const { firstName, lastName, email, password, userType, mobile, acceptTermCondition, organisationName } = req.body

      let check = await validateMobileNumber(mobile);

      if (!check) return errorResponse(res, 400, responseMessage.mobile_num_invalid, responseMessage.errorMessage);

      let checkPassword = await validatePassword(password)

      if (!checkPassword) return errorResponse(res, 400, responseMessage.password_invalid, responseMessage.errorMessage);

      if (!acceptTermCondition) return errorResponse(res, 400, responseMessage.accept_terms_invalid, responseMessage.errorMessage);

      const findUserType = await validateUserType(userTypeArr, userType);

      if (!findUserType.status) return errorResponse(res, 400, responseMessage.user_role_invalid, responseMessage.errorMessage);

      if (findUserType.id !== 4 && findUserType.id !== 5) return errorResponse(res, 400, responseMessage.user_type_invalid, responseMessage.errorMessage);

      const user = await CommonUsers.findOne({ email: email })

      if (user) return errorResponse(res, 400, responseMessage.user_exist_already, responseMessage.errorMessage);

      const newUserDetails = new UserDetails({
        preferredLanguage: 'en',
        isTourComplete: false,
      });

      const savedUserDetail = await newUserDetails.save();

      const subAdminDetails = await Subadminprofile.findOne({ organisationName: organisationName });

      if (!subAdminDetails) return errorResponse(res, 400, responseMessage.org_not_found, responseMessage.errorMessage);

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
        acceptTermCondition: acceptTermCondition,
        isEmailVerified: false,
        isGoogleUser: false,
        isUserProfileCreated: false,
        organisationName: organisationName,
        isAdminApproved: "pending",
        organisationId: (subAdminDetails) ? subAdminDetails._id : ""
      });

      const savedUser = await userStoredInCommonCollection.save();

      if (savedUser) await setEmailToSent(res, savedUser);

    }
  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
}

async function setEmailToSent(res, savedUser) {

  const emailVerificationToken = jwt.sign({ email: savedUser.email }, JWT_SECRET, {
    expiresIn: "1d",
  });

  const transporter = {
    host: "smtp.gmail.com",
    service: EMAIL_SERVICE,
    secure: true,
    port: 465,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  }

  const mailOptions = {
    from: EMAIL_FROM_ADDRESS,
    to: savedUser.email,
    subject: 'Email Verification',
    attachments: [{
      filename: 'testa-logo.png',
      path: 'https://i.ibb.co/z4ZMDQj/testa-logo.png',
      cid: 'testa-logo' //same cid value as in the html img src
    }, {
      filename: 'testa-logo.png',
      path: 'https://i.ibb.co/GTkNybW/bg-testa.png',
      cid: 'bg-testa'
    }, {
      filename: 'Union.png',
      path: 'https://i.ibb.co/w0JwsJ3/Union.png',
      cid: 'Union'
    }, {
      filename: 'Union-1.png',
      path: 'https://i.ibb.co/HrWXkBs/Union-1.png',
      cid: 'Union-1'
    }, {
      filename: 'Union-2.png',
      path: 'https://i.ibb.co/7J62VZF/Union-2.png',
      cid: 'Union-2'
    }, {
      filename: 'Union-3.png',
      path: 'https://i.ibb.co/xsTmm4P/Union-3.png',
      cid: 'Union-3'
    }, {
      filename: 'Union-4.png',
      path: 'https://i.ibb.co/4KGLZYM/Union-4.png',
      cid: 'Union-4'
    }],
    html: `<body bgcolor="#FFFFFF" leftmargin="0" marginwidth="-10" topmargin="0" marginheight="0" >
            <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTbl" style="max-width: 970px!important;margin: auto;">
              <tr>
                <td align="center"  id="bodyCell">
                  <table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="100%" id="emailBody" >
                    <tr>
                      <td>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:transparent">
                          <tr>
                            <td align="center" >
                              <table border="0" cellpadding="0" cellspacing="0" width="95%" class="flexibleContainer" style="margin: 20px auto;border-radius: 20px;border: 1px solid #0000001f;overflow: hidden;">
                                <tr class="demo">
                                  <td align="center"  width="95%" class="flexibleContainerCell">
                                    <table border="0" cellpadding="30" cellspacing="0" width="100%">
                                      <tr>
                                        <td style="padding: 0px;">
                                          <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#FFFFFF" style="font-size:16px;
                                          max-width: 100%;
                                          margin: auto;">
                                            <tr>
                                              <td  style="
                                                padding: 0;
                                                text-align:left;
                                                font-size:15px;
                                                margin-bottom:0;
                                                color: #2c2c2a;
                                                margin-top: 40px;
                                                border: solid 1px #eee;
                                                border-radius: 20px;
                                                overflow: hidden;
                                                width: 100%;
                                              "> 
                                                <div class="overall-content" 
                                                  style="
                                                    padding: 12px 0 0;
                                                    width: 100%;
                                                    box-sizing: border-box;
                                                  "
                                                >
                                                  <div class="testa-topcontent" style="width: 100%;padding-left: 40px;">
                                                    <div class="right-content" style="width:50%;display: inline-block;">
                                                      <div
                                                      style="
                                                        display: block;
                                                        max-width: 100%;
                                                        padding-top: 28px;
                                                      "
                                                    >
                                                      <p style="display: inline-block;">
                                                        <img src="cid:testa-logo" alt="testa-logo" border="0">
                                                      </p>
                                                      <p 
                                                        style="
                                                          font-weight: 400;
                                                          font-size: 20px;
                                                          line-height: 22px;
                                                          letter-spacing: 0.02em;
                                                          color: #000000;
                                                          margin: 0;
                                                          padding-left: 17px;
                                                          display: inline-block;
                                                        "
                                                      >
                                                        Testa Online
                                                      </p>
                                                      </div>
                                                      <h1
                                                        style="
                                                          font-weight: 400;
                                                          font-size: 48px;
                                                          line-height: 58px;
                                                          text-transform: capitalize;
                                                          color: #000000;
                                                          max-width: 100%;
                                                          padding-bottom: 57px;
                                                        "
                                                      >
                                                        Welcome to Testa
                                                      </h1>
                                                      <div style="max-width:100%;">
                                                        <p
                                                          style="
                                                            font-weight: 700;
                                                            font-size: 15px;
                                                            line-height: 22px;
                                                            letter-spacing: 0.02em;
                                                            color: #000000;
                                                            margin: 0;
                                                            padding-bottom: 10px;
                                                          "
                                                        >
                                                          Hi ${savedUser.firstName} ${savedUser.lastName}
                                                        </p>
                                                        <p
                                                          style="
                                                            font-style: normal;
                                                            font-weight: 400;
                                                            font-size: 14px;
                                                            line-height: 19px;
                                                            color: #000000;
                                                            margin: 0;
                                                            padding-bottom: 30px;
                                                          "
                                                        >
                                                          Thank you for Signing up! 
                                                          Please click the button given below to activate your account.
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div class="left-image" style="width:50%;display: inline-block; float: right;text-align: right;">
                                                      <a href="#">
                                                        <img src="cid:bg-testa" alt="bg-testa" border="0">
                                                      </a>
                                                    </div>
                                                  </div>
                                                  <div style="display: block;width: 100%;padding-left: 40px;">
                                                    <p class="verify-btn"
                                                      style="
                                                        background: #2EA8DB;
                                                        box-shadow: 5.5758px 27.879px 22.3032px rgba(0, 0, 0, 0.04);
                                                        border-radius: 5px;
                                                        font-weight: 700;
                                                        font-size: 18px;
                                                        line-height: 22px;
                                                        color: #FDFDFD;
                                                        margin: 0 0 45px;
                                                        padding: 12px 46px;
                                                        display: inline-block;
                                                        width: auto;
                                                      "
                                                    >
                                                    <a href=${CLIENT_URL}/verify-email?token=${emailVerificationToken}>Verify your Account</a>
                                                    </p>
                                                    <p class="access-account"
                                                      style="
                                                        font-style: normal;
                                                        font-weight: 400;
                                                        font-size: 14px;
                                                        line-height: 19px;
                                                        color: #000000;
                                                        display: inline-block;
                                                        width: 100%;
                                                        margin: 0 0 21px;
                                                      "
                                                    >
                                                      You can access your account area to view your orders and change your account settings here: 
                                                      <a style="color: #2EA8DB;" href="http://nextmockup.com/my-account/.">
                                                        http://nextmockup.com/my-account/.
                                                      </a>
                                                    </p>
                                                    <p class="testa-regards"
                                                      style="
                                                        font-style: normal;
                                                        font-weight: 400;
                                                        font-size: 14px;
                                                        line-height: 19px;
                                                        color: #000000;
                                                        display: block;
                                                        width: 100%;
                                                        margin: 0 0 52px;
                                                        text-align: left;
                                                      "
                                                    >
                                                      <span style="display: block;" >We hope you have an enriching experience.</span>
                                                      <span style="display: block;" >Regards,</span>
                                                      <span style="display: block;" >Testa Team</span>
                                                    </p>
                                                    <div class="socail-icons"
                                                      style="
                                                        display: inline-block;
                                                        text-align: center;
                                                        width: 100%;
                                                        margin: 0 0 31px;
                                                      "
                                                    >
                                                      <span style="padding-right: 23px;display: inline-block;">
                                                        <a href="#">
                                                          <img src="cid:Union" alt="Union" border="0">
                                                        </a>
                                                      </span>
                                                      <span style="padding-right: 23px;display: inline-block;">
                                                        <a href="#">
                                                          <img src="cid:Union-1" alt="Union-1" border="0">
                                                        </a>
                                                      </span>
                                                      <span style="padding-right: 23px;display: inline-block;">
                                                        <a href="#">
                                                          <img src="cid:Union-2" alt="Union-2" border="0">
                                                        </a>
                                                      </span>
                                                      <span style="padding-right: 23px;display: inline-block;">
                                                        <a href="#">
                                                          <img src="cid:Union-3" alt="Union-3" border="0">
                                                        </a>
                                                      </span>
                                                      <span style="display: inline-block;">
                                                        <a href="#">
                                                          <img src="cid:Union-4" alt="Union-4" border="0">
                                                        </a>
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div
                                                    style="
                                                      display: block;
                                                      text-align: center;
                                                      width: 100%;
                                                      background: #F9F9F9;
                                                      padding: 22px 0;
                                                    "
                                                  >
                                                    <p
                                                      style="
                                                        font-weight: 700;
                                                        font-size: 15px;
                                                        line-height: 22px;
                                                        letter-spacing: 0.02em;
                                                        color: #000000;
                                                        display: inline-block;
                                                        width: auto;
                                                        margin: 0;
                                                        padding-right: 15px;
                                                      "
                                                    >
                                                      POWERED BY
                                                    </p>
                                                    <p
                                                      style="
                                                        font-weight: 400;
                                                        font-size: 20px;
                                                        line-height: 22px;
                                                        letter-spacing: 0.02em;
                                                        color: #022A50;
                                                        display: inline-block;
                                                        width: auto;
                                                        margin: 0;
                                                      "
                                                    >
                                                      Testa Online
                                                    </p>
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
        </body>`
  };

  let sendPayloadToMail = {
    mailOptions: mailOptions,
    savedUser: savedUser,
    transporter: transporter,
    type: "register",
    message: responseMessage.verify_your_email
  }

  await sendMailToUser(res, sendPayloadToMail);

}

exports.resendMail = async (req, res) => {
  try {
    if (req.body.email) {

      const user = await CommonUsers.findOne({ email: req.body.email });

      if (!user) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);

      if (user.isEmailVerified) return errorResponse(res, 400, responseMessage.email_already_verified, responseMessage.errorMessage);

      await setEmailToSent(res, user);

    }
  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};

exports.verifyEmail = async (req, res) => {

  try {

    const token = req.body.token;

    if (!token) return errorResponse(res, 400, responseMessage.token_missed, responseMessage.errorMessage);

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.email) return errorResponse(res, 400, responseMessage.token_invalid, responseMessage.errorMessage);

    const user = await CommonUsers.findOne({ email: decodedToken.email });

    if (!user) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);

    if (user.isEmailVerified) return errorResponse(res, 400, responseMessage.email_already_verified, responseMessage.errorMessage);

    user.isEmailVerified = true;

    user.isUserProfileCreated = false;

    const savedUser = await user.save();

    let responseData = {
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      userType: savedUser.userType,
      email: savedUser.email,
      mobile: savedUser.mobile,
      isUserProfileCreated: savedUser.isUserProfileCreated
    }

    return sendResponse(res, 200, responseMessage.email_verified, responseData);

  } catch (error) {

    return errorResponse(res, 500, responseMessage.errorMessage, error.message);

  }
}

exports.singIn = async (req, res) => {
  try {

    if (req.body) {

      const existsInDB = await CommonUsers.findOne({ email: req.body.email });

      if (!existsInDB) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);

      if (existsInDB.isGoogleUser) return errorResponse(res, 400, responseMessage.google_register, responseMessage.errorMessage);

      if (!existsInDB.isEmailVerified) return errorResponse(res, 400, responseMessage.email_verify_to_login, responseMessage.errorMessage);

      if (!existsInDB.isUserProfileCreated) return errorResponse(res, 426, responseMessage.user_profile_not_created, responseMessage.errorMessage);

      if (existsInDB.isAdminApproved === "pending") return errorResponse(res, 400, responseMessage.app_in_process_approve_by_admin, responseMessage.errorMessage);

      if (existsInDB.isAdminApproved === "rejected") return errorResponse(res, 400, responseMessage.app_reject, responseMessage.errorMessage);

      if(existsInDB.isTourComplete === undefined) {
          existsInDB['isTourComplete'] = true;
          await existsInDB.save();
      }

      bcrypt.compare(req.body.password, existsInDB.password, (err, passRes) => {

        if (err) return errorResponse(res, 400, responseMessage.auth_failed, err.message);

        if (passRes) {
          const responseData = {
            firstName: existsInDB.firstName,
            lastName: existsInDB.lastName,
            email: existsInDB?.email,
            userType: existsInDB.userType,
            userRole: existsInDB.userRole,
            mobile: existsInDB.mobile,
            _id: existsInDB._id,
            organisationName: existsInDB.organisationName,
            isAdminApproved: existsInDB.isAdminApproved,
            isUserProfileCreated: existsInDB.isUserProfileCreated,
            isTourComplete:existsInDB.isTourComplete,
            token: jwt.sign({ email: existsInDB?.email }, JWT_SECRET, {
              expiresIn: "1h"
            }),
          }

          if (existsInDB.organisationId) responseData['organisationId'] = existsInDB.organisationId; 

          return sendResponse(res, 200, responseMessage.user_login_success, responseData);

        } else {
          return errorResponse(res, 400, responseMessage.enter_correct_password, responseMessage.errorMessage);
        }
      });
    }

  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }

}

exports.redirectToUserProfile = async (req, res) => {

  try {

    if (req.body.email) {

      const user = await CommonUsers.findOne({ email: req.body.email })
        .select("-password");

      if (!user) return errorResponse(res, 400, responseMessage.user_not_found, responseMessage.errorMessage);

      if (user.isUserProfileCreated) return errorResponse(res, 400, responseMessage.user_profile_already_create, responseMessage.errorMessage);

      return sendResponse(res, 200, responseMessage.create_user_profile, user);

    }
  } catch (error) {

    return errorResponse(res, 500, responseMessage.errorMessage, error.message);

  }
}

exports.forgetPassword = async (req, res) => {

  try {

    const user = await CommonUsers.findOne({ email: req.body.email });

    if (!user) return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);

    const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    // Send email with the reset token
    // You can use a library like nodemailer to send the email
    const transporter = {
      host: "smtp.gmail.com",
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: GOOGLE_MAIL_ID,
        pass: GOOGLE_MAIL_PASSWORD,
      },
    };
    const mailOptions = {
      from: "Imran Basha <imranbashasid@gmail.com>",
      to: user.email,
      subject: "Reset Password",
      html: `<p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                 <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                 <a href=${CLIENT_URL}/reset-password/${resetToken}><button>Click Here</button></a>
                 <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
    };

    let sendPayloadToMail = {
      mailOptions: mailOptions,
      savedUser: user,
      transporter: transporter,
      type: "forgot",
      message: responseMessage.reset_password_link_sent_to_email
    }

    await sendMailToUser(res, sendPayloadToMail);

  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};

exports.resetPassword = async (req, res) => {

  try {

    const { resetToken, password } = req.body;

    if (!resetToken) return errorResponse(res, 400, responseMessage.token_required, responseMessage.errorMessage);

    const decodedToken = jwt.verify(resetToken, JWT_SECRET);

    const getUserInput = (decodedToken.userId) ? decodedToken.userId : decodedToken.email;

    if (getUserInput) {

      const user = await CommonUsers.findOne({
        $or: [
          { email: getUserInput },
          { _id: getUserInput }
        ]
      });

      getUserToResetPassword(user, password, res);

    }
  } catch (error) {

    return errorResponse(res, 500, responseMessage.errorMessage, error.message);

  }
};


async function getUserToResetPassword(user, password, res) {

  if (!user) return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);

  const salt = await bcrypt.genSalt(8);

  const hashPasswrods = await bcrypt.hash(password, salt);

  user.password = hashPasswrods;

  const savedUser = await user.save();

  if (savedUser) {

    return sendResponse(res, 200, responseMessage.reset_password_success, {});

  } else {
    return errorResponse(res, 400, responseMessage.password_not_reset, responseMessage.errorMessage);
  }
}

exports.changePassword = async (req, res) => {

  const { oldPassword, newPassword, id } = req.body;

  try {
    // get user
    const user = await CommonUsers.findById(id);

    if (!user) return errorResponse(res, 404, responseMessage.user_not_found, responseMessage.errorMessage);
    // validate old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) return errorResponse(res, 400, responseMessage.enter_old_password, responseMessage.errorMessage);

    let checkNewPassword = validatePassword(newPassword);

    if (!checkNewPassword) return errorResponse(res, 400, responseMessage.password_invalid, responseMessage.errorMessage);

    let checkComparePassword = comparePassword(oldPassword, newPassword);

    if (checkComparePassword) return errorResponse(res, 400, responseMessage.new_password_not_same_as_old_password, responseMessage.errorMessage);

    const salt = await bcrypt.genSalt(8);

    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;

    user.updatedAt = Date.now();

    const updatedUser = await user.save();

    let responseData = {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      userType: updatedUser.userType,
      mobile: updatedUser.mobile
    }

    return sendResponse(res, 200, responseMessage.password_change_success, responseData);

  } catch (error) {
    return errorResponse(res, 500, responseMessage.errorMessage, error.message);
  }
};

function comparePassword(oldPass, newPass) {
  return (oldPass !== newPass) ? false : true;
}

function validateRegisterData(registerBody) {
  try {
    const schema = Joi.object({
      email: Joi.string().min(5).trim().max(50).email().required(),
      mobile: Joi.string().min(10).max(10).required(),
      firstName: Joi.string().min(3).max(50).trim().required(),
      lastName: Joi.string().min(3).max(50).trim().required(),
      password: Joi.string().trim().min(8).max(20).required(),
      userType: Joi.number().required(),
      acceptTermCondition: Joi.boolean().required(),
      organisationName: Joi.string().trim().min(2).max(50).required(),
    })
    return schema.validate(registerBody);
  } catch (error) {
    console.log(error);
  }
}

