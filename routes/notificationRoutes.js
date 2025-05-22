const express = require("express");
const notificationController = require("../controllers/notificationController");
const { auth, isRH } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications
router.get("/", auth, notificationController.getUserNotifications);

// POST /api/notifications - create a new notification
router.post("/", auth, notificationController.createNotification);

// PUT /api/notifications/:id/read
router.put("/:id/read", auth, notificationController.markAsRead);

// PUT /api/notifications/read-all
router.put("/read-all", auth, notificationController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete("/:id", auth, notificationController.deleteNotification);

// GET /api/notifications/all (admin/RH only)
router.get("/all", auth, isRH, notificationController.getAllNotifications);

module.exports = router;
