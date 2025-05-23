const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const checklistController = require("../controllers/checklistController");

const router = express.Router();

// HR: Get onboarding reports
// GET /api/reports/onboarding
router.get(
  "/onboarding",
  auth,
  roleCheck(["hr", "admin"]),
  onboardingController.getOnboardingReports
);

// GET /api/reports/checklists/by-stage
router.get(
  "/checklists/by-stage",
  auth,
  roleCheck(["hr", "manager"]),
  checklistController.getChecklistsByStage
);

module.exports = router;
