const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const eventRoutes = require("./routes/eventRoutes");
const courseRoutes = require("./routes/courseRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const coachingRoutes = require("./routes/coachingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const teamRoutes = require("./routes/teamRoutes");
const programRoutes = require("./routes/programRoutes");
const checklistRoutes = require("./routes/checklistRoutes");
const checklistItemRoutes = require("./routes/checklistItemRoutes");
const checklistAssignmentRoutes = require("./routes/checklistAssignmentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const supervisorRoutes = require("./routes/supervisorRoutes");

const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Simple test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Test route is working!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/coaching", coachingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/checklists", checklistRoutes);
app.use("/api/checklist-items", checklistItemRoutes);
app.use("/api/checklist-assignments", checklistAssignmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/supervisor", supervisorRoutes);
app.use("/api/onboarding/tasks", taskRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
