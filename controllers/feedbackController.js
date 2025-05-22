const { Feedback, User } = require("../models");
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");

// Get sent feedback
const getSentFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { senderId: req.user.id },
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching sent feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get received feedback
const getReceivedFeedback = async (req, res) => {
  try {
    // HR sees all feedback, others see only their own
    const whereClause =
      req.user.role === "hr"
        ? {} // all feedback
        : { receiverId: req.user.id };

    const feedback = await Feedback.findAll({
      where: whereClause,
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching received feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get department feedback
const getDepartmentFeedback = async (req, res) => {
  try {
    if (!req.params.department) {
      return res.status(400).json({ message: "Department is required" });
    }
    const feedback = await Feedback.findAll({
      include: [
        {
          model: User,
          as: "receiver",
          where: { department: req.params.department },
        },
        { model: User, as: "sender" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching department feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create feedback
const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, message, type } = req.body;
    const feedback = await Feedback.create({
      senderId: req.user.id,
      receiverId,
      message,
      type,
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Only allow sender to delete their feedback
    if (feedback.senderId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await feedback.destroy();
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export feedback as CSV
const exportFeedbackCSV = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll();
    const fields = ["employeeId", "type", "answers", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(feedbacks.map((f) => f.toJSON()));
    res.header("Content-Type", "text/csv");
    res.attachment("feedback_report.csv");
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to export feedback" });
  }
};

module.exports = {
  getSentFeedback,
  getReceivedFeedback,
  getDepartmentFeedback,
  createFeedback,
  deleteFeedback,
  exportFeedbackCSV,
};
