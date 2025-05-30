const models = require("../models");
const { Evaluation, User, EvaluationCriteria } = models;
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");

// Get all evaluations
const getAllEvaluations = async (req, res) => {
  try {
    const { employeeId, status, type, departmentId, supervisorId, startDate, endDate } = req.query;
    const where = {};
    
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (type) where.type = type;

    // Add filtering for departmentId and supervisorId through associations
    const include = [
      { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
      { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
    ];

    if (departmentId) {
      // Assuming User model has a departmentId field
      include[0].where = { departmentId }; // Filter by employee's department
      // Or, if filtering by supervisor's department:
      // include[1].where = { departmentId }; // Filter by supervisor's department
      // Let's assume filtering by employee's department for now based on typical reporting needs.
      // If filtering by supervisor's department is needed, we can add another parameter or adjust.
    }

    if (supervisorId) {
        // This filter is already handled by the general where clause if supervisorId matches evaluatorId
        // However, if we want to filter by supervisor of the *employee* on the evaluation, it would be:
        // include[0].where = { ...include[0].where, supervisorId };
        // Sticking to filtering by the evaluatorId for now, as per getEvaluatorEvaluations.
        // If filtering by the employee's supervisor is needed, this logic needs adjustment.
    }

    // Add filtering for date range (assuming on createdAt)
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    const evaluations = await Evaluation.findAll({
      where,
      include,
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
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
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
      dueDate,
      status,
      comments,
      ratings,
      title,
      type,
      criteria,
    } = req.body;

    console.log('Received type:', type);
    console.log('Received dueDate:', dueDate);

    const evaluation = await Evaluation.create({
      employeeId,
      evaluatorId,
      type: type,
      dueDate: dueDate,
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
      dueDate,
      status,
      comments,
      ratings,
      title,
      type,
      criteria,
    } = req.body;

    console.log('Type received in update body:', type);
    console.log('Evaluation object before update:', evaluation);

    await evaluation.update({
      type: type || evaluation.type,
      dueDate: dueDate || evaluation.dueDate,
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
      where: { employeeId: req.params.id },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
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
      where: { evaluatorId: req.params.supervisorId },
      include: [
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
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
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
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
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
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
        { model: User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: User, as: "evaluator", attributes: { exclude: ['passwordHash'] } },
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

    const evaluation = await models.Evaluation.findByPk(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const { scores } = req.body; // Array of { criteriaId, score, comments }

    // Update individual criteria scores and comments
    if (scores && Array.isArray(scores)) {
      for (const score of scores) {
        const criteria = await models.EvaluationCriteria.findByPk(score.criteriaId);
        if (criteria) {
          await criteria.update({
            rating: score.score, // Update the 'rating' column in evaluation_criteria
            comments: score.comments, // Update the 'comments' column in evaluation_criteria
          });
        }
      }
    }

    // Update the overall evaluation status
    await evaluation.update({
      status: "in_progress", // Changed status to a valid ENUM value
      // Removed the incorrect 'scores' update here
    });

    // Fetch the updated evaluation with criteria to return in the response
    const updatedEvaluation = await models.Evaluation.findByPk(req.params.id, {
      include: [
        { model: models.User, as: "employee", attributes: { exclude: ['passwordHash'] } },
        { model: models.User, as: "supervisor", attributes: { exclude: ['passwordHash'] } },
        { model: models.EvaluationCriteria, as: "criteria" }, // Include criteria in the response
      ],
    });

    res.json(updatedEvaluation);
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

// Add evaluation criterion
const addEvaluationCriteria = async (req, res) => {
  try {
    // Temporarily requiring model directly for debugging
    const EvaluationCriteria = require('../models/EvaluationCriteria');

    console.log('Testing EvaluationCriteria access (direct require):', EvaluationCriteria);

    // Re-enabling database interaction
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { evaluationId } = req.params;
    const { category, name, rating, comments } = req.body;

    const evaluation = await models.Evaluation.findByPk(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const newCriteria = await EvaluationCriteria.create({
      evaluationId,
      category,
      criteria: name, // Assuming 'name' from body maps to 'criteria' in DB
      rating: rating, // Using 'rating' from body and mapping to 'rating' in DB
      comments,
    });

    res.status(201).json(newCriteria);
  } catch (error) {
    console.error("Error adding evaluation criteria:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update evaluation criterion
const updateEvaluationCriteria = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // Criterion ID
    const { category, name, rating, comments } = req.body;

    const criteria = await models.EvaluationCriteria.findByPk(id);
    if (!criteria) {
      return res.status(404).json({ message: "Evaluation criteria not found" });
    }

    await criteria.update({
      category,
      criteria: name, // Assuming 'name' from body maps to 'criteria' in DB
      rating, // Using 'rating' from body
      comments,
    });

    res.json(criteria);
  } catch (error) {
    console.error("Error updating evaluation criteria:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete evaluation criterion
const deleteEvaluationCriterion = async (req, res) => {
  try {
    const { id } = req.params; // Criterion ID

    const criterion = await models.EvaluationCriteria.findByPk(id);
    if (!criterion) {
      return res.status(404).json({ message: "Evaluation criterion not found" });
    }

    await criterion.destroy();
    res.json({ message: "Evaluation criterion deleted successfully" });
  } catch (error) {
    console.error("Error deleting evaluation criterion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get evaluation criteria by evaluation ID
const getEvaluationCriteriaByEvaluationId = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    const criteria = await models.EvaluationCriteria.findAll({
      where: { evaluationId: evaluationId },
      // Optionally include related data if needed, e.g., for the criterion type or category details
    });

    if (!criteria || criteria.length === 0) {
      // Return 404 if the evaluation or its criteria are not found
      // Or return an empty array if the evaluation exists but has no criteria
      // Let's return an empty array if no criteria are found, as the evaluation might exist.
      return res.json([]);
    }

    res.json(criteria);
  } catch (error) {
    console.error("Error fetching evaluation criteria by evaluation ID:", error);
    res.status(500).json({ message: "Server error" });
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
  addEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriterion,
  getEvaluationCriteriaByEvaluationId,
};
