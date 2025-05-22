// backend/controllers/surveyController.js
const {
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyQuestionResponse,
  User,
  Notification,
  Question,
  Response,
} = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

// Get all surveys
const getAllSurveys = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      include: [{ model: Question }, { model: User, as: "creator" }],
    });
    res.json(surveys);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's surveys
const getUserSurveys = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      where: {
        targetRole: {
          [Op.or]: ["all", req.user.role],
        },
        status: "active",
      },
      include: [{ model: Question }, { model: User, as: "creator" }],
    });
    res.json(surveys);
  } catch (error) {
    console.error("Error fetching user surveys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get survey by ID
const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id, {
      include: [{ model: Question }, { model: User, as: "creator" }],
    });
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    res.json(survey);
  } catch (error) {
    console.error("Error fetching survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create survey
const createSurvey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, type, targetRole, description } = req.body;
    const survey = await Survey.create({
      title,
      type,
      targetRole,
      description,
      creatorId: req.user.id,
      status: "draft",
    });

    res.status(201).json(survey);
  } catch (error) {
    console.error("Error creating survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update survey
const updateSurvey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const { title, status, description } = req.body;
    await survey.update({
      title: title || survey.title,
      status: status || survey.status,
      description: description || survey.description,
    });

    res.json(survey);
  } catch (error) {
    console.error("Error updating survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete survey
const deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    await survey.destroy();
    res.json({ message: "Survey deleted successfully" });
  } catch (error) {
    console.error("Error deleting survey:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add question to survey
const addQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const { text, type, options } = req.body;
    const question = await Question.create({
      surveyId: survey.id,
      text,
      type,
      options,
    });

    res.status(201).json(question);
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const { text, type, options } = req.body;
    await question.update({
      text: text || question.text,
      type: type || question.type,
      options: options || question.options,
    });

    res.json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    await question.destroy();
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Submit survey response
const submitResponse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const { answers } = req.body;
    const response = await Response.create({
      surveyId: survey.id,
      userId: req.user.id,
      answers,
    });

    res.status(201).json(response);
  } catch (error) {
    console.error("Error submitting response:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get survey responses
const getSurveyResponses = async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const responses = await Response.findAll({
      where: { surveyId: survey.id },
      include: [{ model: User }],
    });

    res.json(responses);
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllSurveys,
  getUserSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitResponse,
  getSurveyResponses,
};
