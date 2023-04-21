require("dotenv").config()
const router = require("express").Router();

const { getAdminDashboard, getDashboardStatistics, getUpcomingAssessement, getAssessmentStatistics, getActiveClientStatistics, setResponsiveDashboard, getResponsiveDashboard } = require("../controller/admin-dashboard-controller");
const adminAuth = require("../middleware/adminAuth");

router.get("/admin-dashboard", adminAuth, getAdminDashboard);
router.get("/admin-dashboard-basic-details", getDashboardStatistics);
router.post("/upcoming-assessment", getUpcomingAssessement);
router.get("/assessment-statistics", getAssessmentStatistics);
router.get("/active-client-statistics", getActiveClientStatistics);
router.post("/set-dashboard-style", setResponsiveDashboard);
router.get("/get-dashboard-style/:id", getResponsiveDashboard);

module.exports = router;