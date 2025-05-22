const express = require("express");
const { check } = require("express-validator");
const onboardingController = require("../controllers/onboardingController");
const { auth } = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const router = express.Router();

// Employee: Get my onboarding progress
// GET /api/onboarding/journey
router.get("/journey", auth, onboardingController.getMyProgress);

// HR: Get onboarding progress for a specific employee
// GET /api/onboarding/journey/:userId
router.get(
  "/journey/:userId",
  auth,
  roleCheck(["hr", "supervisor"]),
  onboardingController.getUserProgress
);

// HR/Admin: Get all onboarding progresses
// GET /api/onboarding/progresses
router.get(
  "/progresses",
  auth,
  roleCheck(["hr", "admin"]),
  onboardingController.getAllProgresses
);

// Employee: Update my onboarding progress
// PUT /api/onboarding/journey
router.put(
  "/journey",
  [
    auth,
    check("progress", "Progress must be a number between 0 and 100")
      .optional()
      .isInt({ min: 0, max: 100 }),
  ],
  onboardingController.updateMyProgress
);

// HR: Update onboarding progress for employee
// PUT /api/onboarding/journey/:userId
router.put(
  "/journey/:userId",
  [
    auth,
    roleCheck(["hr", "supervisor"]),
    check("stage", "Stage must be prepare, orient, land, integrate, or excel")
      .optional()
      .isIn(["prepare", "orient", "land", "integrate", "excel"]),
    check("progress", "Progress must be a number between 0 and 100")
      .optional()
      .isInt({ min: 0, max: 100 }),
  ],
  onboardingController.updateUserProgress
);

// HR: Assign checklists to an employee
// POST /api/onboarding/checklists/assign
router.post(
  "/checklists/assign",
  [
    auth,
    roleCheck(["hr", "admin"]),
    check("userId", "User ID is required").exists(),
    check("checklistIds", "Checklist IDs must be an array").isArray(),
  ],
  onboardingController.assignChecklists
);

// HR: Reset employee's journey
// POST /api/onboarding/journey/:userId/reset
router.post(
  "/journey/:userId/reset",
  [
    auth,
    roleCheck(["hr", "admin"]),
    check(
      "resetToStage",
      "Stage must be prepare, orient, land, integrate, or excel"
    )
      .optional()
      .isIn(["prepare", "orient", "land", "integrate", "excel"]),
  ],
  onboardingController.resetJourney
);

// Keeping the following routes for backward compatibility
// GET /api/onboarding/:id
router.get("/:id", auth, onboardingController.getOnboardingProgress);

// PUT /api/onboarding/:id
router.put(
  "/:id",
  [
    auth,
    roleCheck(["hr", "supervisor"]),
    check("stage", "Stage must be prepare, orient, land, integrate, or excel")
      .optional()
      .isIn(["prepare", "orient", "land", "integrate", "excel"]),
    check("progress", "Progress must be a number between 0 and 100")
      .optional()
      .isInt({ min: 0, max: 100 }),
  ],
  onboardingController.updateOnboardingProgress
);

// GET /api/onboarding/export/csv (HR only)
router.get(
  "/export/csv",
  auth,
  roleCheck(["hr"]),
  onboardingController.exportOnboardingCSV
);

module.exports = router;
