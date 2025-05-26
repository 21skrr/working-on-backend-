const express = require("express");
const { check } = require("express-validator");
const feedbackController = require("../controllers/feedbackController");
const { auth, checkRole, isRH } = require("../middleware/auth");

const router = express.Router();

// GET /api/feedback/all
router.get("/all", auth, checkRole("hr"), feedbackController.getAllFeedback);

// GET /api/feedback/sent
router.get("/sent", auth, feedbackController.getSentFeedback);

// GET /api/feedback/received
router.get("/received", auth, feedbackController.getReceivedFeedback);

// GET /api/feedback/department
router.get(
  "/department",
  auth,
  checkRole("manager", "hr"),
  feedbackController.getDepartmentFeedback
);

// GET /api/feedback/export
router.get(
  "/export",
  [
    auth,
    checkRole("hr"),
    check("format").optional().isIn(["csv"]).withMessage("Format must be csv"),
    check("dateRange").optional().isIn(["daily", "weekly", "monthly", "yearly"]).withMessage("Invalid date range"),
    check("category").optional().isIn(["all", "onboarding", "training", "support", "general"]).withMessage("Invalid category")
  ],
  feedbackController.exportFeedback
);

// GET /api/feedback/user/:userId
router.get("/user/:userId", auth, feedbackController.getFeedbackByUserId);

// GET /api/feedback/history
router.get("/history", auth, feedbackController.getFeedbackHistory);

// GET /api/feedback/analytics
router.get(
  "/analytics",
  auth,
  checkRole("manager", "hr"),
  feedbackController.getDepartmentFeedbackAnalytics
);

// PUT /api/feedback/:feedbackId/categorize
router.put(
  "/:feedbackId/categorize",
  [
    auth,
    checkRole("hr", "supervisor"),
    check("categories", "Categories must be an array").isArray(),
    check("categories.*", "Each category must be a valid type")
      .isIn(["training", "supervisor", "process"]),
    check("priority", "Priority must be one of: low, medium, high")
      .isIn(["low", "medium", "high"]),
    check("status", "Status must be one of: pending, under_review, in_progress, resolved")
      .isIn(["pending", "in-progress", "completed"])
  ],
  feedbackController.categorizeFeedback
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
    check("content", "Content is required").not().isEmpty(),
    check("type", "Type must be onboarding, training, support, or general")
      .isIn(["onboarding", "training", "support", "general"]),
    check("isAnonymous", "isAnonymous must be a boolean").isBoolean(),
    check("shareWithSupervisor", "shareWithSupervisor must be a boolean").isBoolean()
  ],
  feedbackController.createFeedback
);

// POST /api/feedback/{feedbackId}/response
router.post(
  "/:feedbackId/response",
  [
    auth,
    checkRole("supervisor", "hr", "manager"),
    check("response", "Response message is required").not().isEmpty(),
    check("status", "Status must be one of: pending, in-progress, completed")
      .isIn(["pending", "in-progress", "completed"])
  ],
  feedbackController.respondToFeedback
);

// POST /api/feedback/:feedbackId/escalate
router.post(
  "/:feedbackId/escalate",
  [
    auth,
    checkRole("supervisor", "hr"),
    check("escalateTo", "Escalate to must be either manager or hr")
      .isIn(["manager", "hr"]),
    check("reason", "Reason is required").not().isEmpty(),
    check("notifyParties", "Notify parties must be an array").isArray(),
    check("notifyParties.*", "Each notify party must be either supervisor or hr")
      .isIn(["supervisor", "hr"])
  ],
  feedbackController.escalateFeedback
);

// DELETE /api/feedback/:id
router.delete("/:id", auth, feedbackController.deleteFeedback);

module.exports = router;
