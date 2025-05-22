const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const userController = require("../controllers/userController");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const userValidation = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("role")
    .isIn(["employee", "supervisor", "manager", "admin"])
    .withMessage("Invalid role"),
  check("department").notEmpty().withMessage("Department is required"),
  check("startDate").isISO8601().withMessage("Valid start date is required"),
  check("programType")
    .isIn([
      "inkompass",
      "earlyTalent",
      "apprenticeship",
      "academicPlacement",
      "workExperience",
    ])
    .withMessage("Invalid program type"),
];

// Get all users (admin and hr only)
router.get("/", auth, checkRole("admin", "hr"), userController.getAllUsers);

// Get user by ID
router.get("/:id", auth, userController.getUserById);

// Create new user (admin and hr only)
router.post(
  "/",
  auth,
  checkRole("admin", "hr"),
  userValidation,
  userController.createUser
);

// Update user
router.put("/:id", auth, userValidation, userController.updateUser);

// Delete user (admin only)
router.delete("/:id", auth, checkRole("hr"), userController.deleteUser);

// Get team members (supervisor/manager only)
router.get(
  "/team/members",
  auth,
  checkRole("supervisor", "manager"),
  userController.getTeamMembers
);

// Debug endpoint: Get current user info
router.get("/me", auth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

module.exports = router;
