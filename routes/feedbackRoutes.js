const express = require("express");
const { check } = require("express-validator");
const feedbackController = require("../controllers/feedbackController");
const { auth, checkRole, isRH } = require("../middleware/auth");

const router = express.Router();

// GET /api/feedback/sent
router.get("/sent", auth, feedbackController.getSentFeedback);

// GET /api/feedback/received
router.get("/received", auth, feedbackController.getReceivedFeedback);

// GET /api/feedback/department/:department
router.get(
  "/department/:department",
  auth,
  checkRole("hr"),
  feedbackController.getDepartmentFeedback
);

// GET /api/feedback/export/csv (HR only)
router.get("/export/csv", auth, isRH, feedbackController.exportFeedbackCSV);

// GET /api/feedback/user/:userId
router.get("/user/:userId", auth, feedbackController.getFeedbackByUserId);

// GET /api/feedback/history
router.get("/history", auth, feedbackController.getFeedbackHistory);

// GET /api/departments/feedback/analytics
router.get(
  "/departments/feedback/analytics",
  auth,
  checkRole("manager", "hr"),
  feedbackController.getDepartmentFeedbackAnalytics
);

// POST /api/feedback/{feedbackId}/notes
router.post(
  "/:feedbackId/notes",
  [
    auth,
    checkRole("supervisor", "hr"),
    check("notes", "Notes are required").not().isEmpty(),
    check("status")
      .optional()
      .isIn(["pending", "in-progress", "completed"])
      .withMessage("Status must be pending, in-progress, or completed"),
    check("followUpDate")
      .optional()
      .isISO8601()
      .withMessage("Follow up date must be a valid date")
  ],
  feedbackController.addFeedbackNotes
);

// POST /api/feedback/{feedbackId}/followup
router.post(
  "/:feedbackId/followup",
  [
    auth,
    checkRole("supervisor", "hr"),
    check("scheduledDate", "Scheduled date is required")
      .not()
      .isEmpty()
      .isISO8601()
      .withMessage("Scheduled date must be a valid date"),
    check("participants", "Participants array is required")
      .isArray()
      .not()
      .isEmpty(),
    check("participants.*", "Each participant must be a valid UUID")
      .isUUID(),
    check("notes", "Notes are required")
      .not()
      .isEmpty()
      .isString()
  ],
  feedbackController.addFeedbackFollowup
);

// POST /api/feedback
router.post(
  "/",
  [
    auth,
    check("message", "Message is required").not().isEmpty(),
    check(
      "type",
      "Type must be onboarding, training, support, or general"
    ).isIn(["onboarding", "training", "support", "general"]),
  ],
  feedbackController.createFeedback
);

// DELETE /api/feedback/:id
router.delete("/:id", auth, feedbackController.deleteFeedback);

module.exports = router;
