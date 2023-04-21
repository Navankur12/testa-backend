require("dotenv").config()
const router = require("express").Router();

const { createUserProfile, getUserProfile, updateUserProfile,getAllUserProfile,createAdminProfile } = require("../controller/userProfile-controller");
const auth = require("../middleware/userAuth");
router.post("/createProfile", createUserProfile);
router.get("/getUserProfile/:id", auth, getUserProfile);
router.put('/updateProfile', auth, updateUserProfile);
router.get("/getAllUserProfile",auth,getAllUserProfile);
router.post("/createSuperAdmin",createAdminProfile);
module.exports = router;