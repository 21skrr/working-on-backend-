const express = require("express");
const { check } = require("express-validator");
const evaluationController = require("../controllers/evaluationController");
const { auth, checkRole, isRH } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const evaluationValidation = [
  check("title", "Title is required").not().isEmpty(),
  check("type", "Evaluation type is required").isIn([
    "performance",
    "skill",
    "behavior",
    "competency",
  ]),
  check("criteria", "Criteria must be an array").isArray(),
  check("criteria.*.name", "Criteria name is required").not().isEmpty(),
  check("criteria.*.weight", "Criteria weight is required").isFloat({
    min: 0,
    max: 1,
  }),
  check("criteria.*.description", "Criteria description is required")
    .not()
    .isEmpty(),
];

// GET /api/evaluations/user
router.get("/user", auth, evaluationController.getUserEvaluations);

// GET /api/evaluations/supervisor
router.get(
  "/supervisor",
  auth,
  checkRole("supervisor", "hr"),
  evaluationController.getSupervisorEvaluations
);

// GET /api/evaluations/review
router.get(
  "/review",
  auth,
  checkRole("manager", "hr"),
  evaluationController.getReviewEvaluations
);

// GET /api/evaluations/:id
router.get("/:id", auth, evaluationController.getEvaluationById);

// POST /api/evaluations
router.post(
  "/",
  [auth, checkRole("hr", "supervisor"), evaluationValidation],
  evaluationController.createEvaluation
);

// PUT /api/evaluations/:id
router.put(
  "/:id",
  [auth, checkRole("hr", "supervisor"), evaluationValidation],
  evaluationController.updateEvaluation
);

// PUT /api/evaluations/:id/review
router.put(
  "/:id/review",
  [auth, checkRole("manager", "hr")],
  evaluationController.reviewEvaluation
);

// DELETE /api/evaluations/:id
router.delete(
  "/:id",
  [auth, checkRole("hr", "supervisor")],
  evaluationController.deleteEvaluation
);

// Evaluation submissions
router.post(
  "/:id/submit",
  [
    auth,
    check("scores", "Scores must be an array").isArray(),
    check("scores.*.criteriaId", "Criteria ID is required").not().isEmpty(),
    check("scores.*.score", "Score must be between 1 and 5").isInt({
      min: 1,
      max: 5,
    }),
    check("scores.*.comments", "Comments are required").not().isEmpty(),
  ],
  evaluationController.submitEvaluation
);

// GET /api/evaluations/export/csv (HR only)
router.get("/export/csv", auth, isRH, evaluationController.exportEvaluationCSV);

module.exports = router;
