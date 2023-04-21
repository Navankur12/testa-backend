require("dotenv").config()
const router = require("express").Router();
const { registerUser, singIn, forgetPassword, resetPassword, verifyEmail,changePassword,redirectToUserProfile,resendMail} = require("../controller/auth");
const auth = require("../middleware/userAuth");
router.post("/registeruser",registerUser);
router.post("/verify-email", verifyEmail);
router.post("/loginuser", singIn);
router.post("/forget-password", forgetPassword);
router.post("/reset-password",resetPassword);
router.post("/changepassword",auth,changePassword);
router.post("/basic-user-detail",redirectToUserProfile);
router.post("/resend-mail",resendMail)
module.exports = router;