const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// HR: Get onboarding reports
// GET /api/reports/onboarding
router.get(
  "/onboarding",
  auth,
  roleCheck(["hr", "admin"]),
  onboardingController.getOnboardingReports
);

module.exports = router;
