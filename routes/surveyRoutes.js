const express = require("express");
const { check } = require("express-validator");
const surveyController = require("../controllers/surveyController");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/surveys
router.get("/", auth, checkRole("hr"), surveyController.getAllSurveys);

// GET /api/surveys/user
router.get("/user", auth, surveyController.getUserSurveys);

// GET /api/surveys/:id
router.get("/:id", auth, surveyController.getSurveyById);

// POST /api/surveys
router.post(
  "/",
  [
    auth,
    checkRole("hr"),
    check("title", "Title is required").not().isEmpty(),
    check(
      "type",
      "Type must be 3-month, 6-month, 12-month, training, or general"
    ).isIn(["3-month", "6-month", "12-month", "training", "general"]),
    check(
      "targetRole",
      "Target role must be employee, supervisor, manager, hr, or all"
    ).isIn(["employee", "supervisor", "manager", "hr", "all"]),
  ],
  surveyController.createSurvey
);

// PUT /api/surveys/:id
router.put(
  "/:id",
  [
    auth,
    checkRole("hr"),
    check("title", "Title is required").optional(),
    check("status", "Status must be draft, active, or completed")
      .optional()
      .isIn(["draft", "active", "completed"]),
  ],
  surveyController.updateSurvey
);

// DELETE /api/surveys/:id
router.delete("/:id", auth, checkRole("hr"), surveyController.deleteSurvey);

// POST /api/surveys/:id/questions
router.post(
  "/:id/questions",
  [
    auth,
    checkRole("hr"),
    check("text", "Question text is required").not().isEmpty(),
    check("type", "Type must be multiple_choice, rating, or text").isIn([
      "multiple_choice",
      "rating",
      "text",
    ]),
  ],
  surveyController.addQuestion
);

// PUT /api/surveys/questions/:id
router.put(
  "/questions/:id",
  [
    auth,
    checkRole("hr"),
    check("text", "Question text is required").optional(),
    check("type", "Type must be multiple_choice, rating, or text")
      .optional()
      .isIn(["multiple_choice", "rating", "text"]),
  ],
  surveyController.updateQuestion
);

// DELETE /api/surveys/questions/:id
router.delete(
  "/questions/:id",
  auth,
  checkRole("hr"),
  surveyController.deleteQuestion
);

// POST /api/surveys/:id/responses
router.post(
  "/:id/responses",
  [auth, check("answers", "Answers are required").isArray()],
  surveyController.submitResponse
);

// GET /api/surveys/:id/responses
router.get(
  "/:id/responses",
  auth,
  checkRole("hr"),
  surveyController.getSurveyResponses
);

module.exports = router;
