const { Notification, CoachingSession } = require("../models");
const { Op } = require("sequelize");

// Get user's notifications
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "system",
      isRead: false,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({ isRead: true });
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.destroy();
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all notifications (admin/RH only)
const getAllNotifications = async (req, res) => {
  try {
    const { type, userId, from, to } = req.query;
    const where = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (from || to) where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get reminders for upcoming/overdue items (type 'task' and unread)
const getReminders = async (req, res) => {
  try {
    const reminders = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "task",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get feedback form availability (type 'feedback' and unread)
const getFeedbackAvailability = async (req, res) => {
  try {
    const feedbacks = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "feedback",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback availability:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get new document notifications (type 'document' and unread)
const getDocumentNotifications = async (req, res) => {
  try {
    const documents = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "document",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching document notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get new training notifications (type 'training' and unread)
const getTrainingNotifications = async (req, res) => {
  try {
    const trainings = await Notification.findAll({
      where: {
        userId: req.user.id,
        type: "training",
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(trainings);
  } catch (error) {
    console.error("Error fetching training notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get coaching session notifications (actual coaching_sessions for the user)
const getCoachingSessionNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await CoachingSession.findAll({
      where: {
        [Op.or]: [
          { userId }, // as employee
          { supervisorId: userId }, // as supervisor
        ],
      },
      order: [["scheduledFor", "DESC"]],
    });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching coaching session notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  getReminders,
  getFeedbackAvailability,
  getDocumentNotifications,
  getTrainingNotifications,
  getCoachingSessionNotifications,
};
