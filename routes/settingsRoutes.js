const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// HR: Update notification settings
// PUT /api/settings/notifications/onboarding
router.put(
  "/notifications/onboarding",
  [
    auth,
    roleCheck(["hr", "admin"]),
    check("settings", "Settings object is required").isObject(),
  ],
  onboardingController.updateNotificationSettings
);

// GET /api/settings/notifications
router.get(
  "/notifications",
  auth,
  onboardingController.getNotificationSettings
);

// PUT /api/settings/notifications
router.put(
  "/notifications",
  auth,
  onboardingController.updateUserNotificationSettings
);

module.exports = router;
