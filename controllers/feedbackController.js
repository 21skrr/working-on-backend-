const { Feedback, User, FeedbackNote, FeedbackFollowup, FeedbackFollowupParticipant } = require("../models");
const { validationResult } = require("express-validator");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");

// Get sent feedback
const getSentFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { fromUserId: req.user.id },
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
        : { toUserId: req.user.id };

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

    const { toUserId, message, type } = req.body;
    const feedback = await Feedback.create({
      fromUserId: req.user.id,
      toUserId,
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
    if (feedback.fromUserId !== req.user.id) {
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

// Get feedback for a specific user (as receiver)
const getFeedbackByUserId = async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { toUserId: req.params.userId },
      include: [
        { model: User, as: "sender" },
        { model: User, as: "receiver" },
      ],
    });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback by userId:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback history (both sent and received)
const getFeedbackHistory = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get both sent and received feedback
    const feedback = await Feedback.findAndCountAll({
      where: {
        [Op.or]: [
          { fromUserId: req.user.id },
          { toUserId: req.user.id }
        ],
        ...dateFilter
      },
      include: [
        { 
          model: User, 
          as: "sender",
          attributes: ['id', 'name', 'email', 'department'] 
        },
        { 
          model: User, 
          as: "receiver",
          attributes: ['id', 'name', 'email', 'department']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      feedback: feedback.rows,
      total: feedback.count,
      currentPage: page,
      totalPages: Math.ceil(feedback.count / limit)
    });
  } catch (error) {
    console.error("Error fetching feedback history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add notes to feedback
const addFeedbackNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { notes, followUpDate, status } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create feedback note
    const feedbackNote = await FeedbackNote.create({
      feedbackId,
      supervisorId: req.user.id,
      note: notes,
      followUpDate: followUpDate || null,
      status: status || 'pending'
    });

    // Include user information in response
    const noteWithUser = await FeedbackNote.findByPk(feedbackNote.id, {
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'name', 'role'],
        foreignKey: 'supervisorId'
      }]
    });

    res.status(201).json(noteWithUser);
  } catch (error) {
    console.error("Error adding feedback notes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add follow-up to feedback
const addFeedbackFollowup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { feedbackId } = req.params;
    const { scheduledDate, participants, notes } = req.body;

    // Find the feedback
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Create the follow-up
    const followup = await FeedbackFollowup.create({
      feedbackId,
      scheduledDate,
      notes,
      createdBy: req.user.id,
      status: "scheduled"
    });

    // Add participants
    await Promise.all(
      participants.map(userId =>
        FeedbackFollowupParticipant.create({
          followupId: followup.id,
          userId
        })
      )
    );

    // Fetch the complete follow-up with participants
    const followupWithDetails = await FeedbackFollowup.findByPk(followup.id, {
      include: [
        {
          model: User,
          as: "participants",
          attributes: ["id", "name", "email", "role"],
          through: { attributes: [] }
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "role"]
        }
      ]
    });

    res.status(201).json(followupWithDetails);
  } catch (error) {
    console.error("Error adding feedback follow-up:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Department Feedback Analytics
const getDepartmentFeedbackAnalytics = async (req, res) => {
  try {
    const { departmentId, startDate, endDate } = req.query;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    // Find all users in the department
    const users = await User.findAll({
      where: { department: departmentId },
      attributes: ["id", "name", "email"]
    });
    const userIds = users.map(u => u.id);

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get feedback for users in department (sent or received)
    const feedbacks = await Feedback.findAll({
      where: {
        [Op.or]: [
          { fromUserId: { [Op.in]: userIds } },
          { toUserId: { [Op.in]: userIds } }
        ],
        ...dateFilter
      },
      include: [
        { model: User, as: "fromUser", attributes: ["id", "name", "email"] },
        { model: User, as: "toUser", attributes: ["id", "name", "email"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Analytics: count by type
    const byType = {};
    feedbacks.forEach(fb => {
      byType[fb.type] = (byType[fb.type] || 0) + 1;
    });

    // Analytics: trend by date
    const trend = {};
    feedbacks.forEach(fb => {
      const date = fb.createdAt.toISOString().slice(0, 10);
      trend[date] = (trend[date] || 0) + 1;
    });

    res.json({
      total: feedbacks.length,
      byType,
      trend,
      feedbacks
    });
  } catch (error) {
    console.error("Error fetching department feedback analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSentFeedback,
  getReceivedFeedback,
  getDepartmentFeedback,
  createFeedback,
  deleteFeedback,
  exportFeedbackCSV,
  getFeedbackByUserId,
  getFeedbackHistory,
  addFeedbackNotes,
  addFeedbackFollowup,
  getDepartmentFeedbackAnalytics
};
