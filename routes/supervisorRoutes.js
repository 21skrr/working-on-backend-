const express = require("express");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const supervisorController = require("../controllers/supervisorController");

const router = express.Router();

// View Team Members' Progress
// GET /api/supervisor/team/onboarding
router.get(
  "/team/onboarding",
  auth,
  roleCheck(["supervisor", "manager", "hr"]),
  supervisorController.getTeamOnboardingProgress
);

// Review Dashboard
// GET /api/supervisor/dashboard/onboarding
router.get(
  "/dashboard/onboarding",
  auth,
  roleCheck(["supervisor", "manager", "hr"]),
  supervisorController.getOnboardingDashboard
);

module.exports = router;
