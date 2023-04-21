const express = require("express");
const router = express.Router()
const { createSubadminProfile, getSubadminProfile, updateSubadminProfile, removeSubadminProfile, getAllSubadminProfile, getOrganisationDetails, acceptOrReject, userStatus } = require("../controller/subadminController")

const adminAuth = require("../middleware/adminAuth");
const auth = require("../middleware/userAuth");

router.post("/subadmin-profile", adminAuth, createSubadminProfile);
router.put("/status", adminAuth, acceptOrReject);
router.get("/subadmin-profile/:id", adminAuth, getSubadminProfile);
router.put("/updateSubadminProfile/:id", adminAuth, updateSubadminProfile);
router.get("/getAllSubadminProfile",adminAuth, getAllSubadminProfile);
router.delete("/removeSubadminProfile/:id", adminAuth, removeSubadminProfile);
router.get("/organisationDetails", getOrganisationDetails);
router.put("/subadmin-statuschange/:id", adminAuth, userStatus);
module.exports = router;