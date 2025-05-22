const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checklistController = require("../controllers/checklistController");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const assignmentValidation = [
  check("userId", "User ID is required").not().isEmpty(),
  check("checklistId", "Checklist ID is required").not().isEmpty(),
  check("dueDate", "Due date must be a valid date").optional().isISO8601(),
  check("isAutoAssigned", "isAutoAssigned must be a boolean")
    .optional()
    .isBoolean(),
];

const bulkAssignmentValidation = [
  check("checklistId", "Checklist ID is required").not().isEmpty(),
  check("userIds", "User IDs must be an array").isArray(),
  check("dueDate", "Due date must be a valid date").optional().isISO8601(),
  check("isAutoAssigned", "isAutoAssigned must be a boolean")
    .optional()
    .isBoolean(),
];

// @route   POST /api/checklist-assignments
// @desc    Assign a checklist to a user
// @access  Private (HR/Supervisor)
router.post(
  "/",
  [auth, assignmentValidation],
  checklistController.assignChecklistToUser
);

// @route   POST /api/checklist-assignments/bulk
// @desc    Assign a checklist to multiple users
// @access  Private (HR/Supervisor)
router.post(
  "/bulk",
  [auth, bulkAssignmentValidation],
  checklistController.bulkAssignChecklist
);

// @route   GET /api/checklist-assignments/user/:userId
// @desc    Get checklist assignments for a specific user
// @access  Private (HR/Supervisor or the user themselves)
router.get("/user/:userId", auth, checklistController.getUserAssignments);

// @route   GET /api/checklist-assignments/my
// @desc    Get the current user's assignments
// @access  Private
router.get("/my", auth, checklistController.getUserAssignments);

module.exports = router;
