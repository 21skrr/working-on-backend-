const { Evaluation, User } = require("../models");
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");

// Get all evaluations
const getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get evaluation by ID
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, {
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }
    res.json(evaluation);
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new evaluation
const createEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      employeeId,
      evaluatorId,
      evaluationType,
      evaluationDate,
      status,
      comments,
      ratings,
      title,
      type,
      criteria,
    } = req.body;

    const evaluation = await Evaluation.create({
      employeeId,
      evaluatorId,
      evaluationType: type,
      evaluationDate,
      status,
      comments,
      ratings,
      title,
      criteria,
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error("Error creating evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update evaluation
const updateEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const {
      evaluationType,
      evaluationDate,
      status,
      comments,
      ratings,
      title,
      type,
      criteria,
    } = req.body;

    await evaluation.update({
      evaluationType: type || evaluation.evaluationType,
      evaluationDate: evaluationDate || evaluation.evaluationDate,
      status: status || evaluation.status,
      comments: comments || evaluation.comments,
      ratings: ratings || evaluation.ratings,
      title: title || evaluation.title,
      criteria: criteria || evaluation.criteria,
    });

    res.json(evaluation);
  } catch (error) {
    console.error("Error updating evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete evaluation
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    await evaluation.destroy();
    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employee evaluations
const getEmployeeEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { employeeId: req.params.employeeId },
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching employee evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get evaluator evaluations
const getEvaluatorEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { evaluatorId: req.params.evaluatorId },
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching evaluator evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's evaluations
const getUserEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { employeeId: req.user.id },
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching user evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get supervisor's evaluations
const getSupervisorEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { evaluatorId: req.user.id },
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching supervisor evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get review evaluations
const getReviewEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll({
      where: { status: "pending_review" },
      include: [
        { model: User, as: "employee" },
        { model: User, as: "evaluator" },
      ],
    });
    res.json(evaluations);
  } catch (error) {
    console.error("Error fetching review evaluations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Review evaluation
const reviewEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const { status, reviewComments } = req.body;
    await evaluation.update({
      status,
      reviewComments,
    });

    res.json(evaluation);
  } catch (error) {
    console.error("Error reviewing evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit evaluation
const submitEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const { scores } = req.body;
    await evaluation.update({
      scores,
      status: "pending_review",
    });

    res.json(evaluation);
  } catch (error) {
    console.error("Error submitting evaluation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export evaluations as CSV
const exportEvaluationCSV = async (req, res) => {
  try {
    const evaluations = await Evaluation.findAll();
    const fields = [
      "employeeId",
      "evaluatorId",
      "criteria",
      "comments",
      "createdAt",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(evaluations.map((e) => e.toJSON()));
    res.header("Content-Type", "text/csv");
    res.attachment("evaluation_report.csv");
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to export evaluations" });
  }
};

module.exports = {
  getAllEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEmployeeEvaluations,
  getEvaluatorEvaluations,
  getUserEvaluations,
  getSupervisorEvaluations,
  getReviewEvaluations,
  reviewEvaluation,
  submitEvaluation,
  exportEvaluationCSV,
};
