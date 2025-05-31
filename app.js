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
const organizationAnalyticsRoutes = require('./routes/organizationAnalyticsRoutes');
const personalAnalyticsRoutes = require('./routes/personalAnalyticsRoutes');
const teamAnalyticsRoutes = require('./routes/teamAnalyticsRoutes');
const departmentAnalyticsRoutes = require('./routes/departmentAnalyticsRoutes');
const personalReportsRoutes = require('./routes/personalReportsRoutes');
const teamReportsRoutes = require("./routes/teamReportsRoutes");
const managerReportsRoutes = require("./routes/managerReportsRoutes");
const departmentReportsRoutes = require("./routes/departmentReportsRoutes");
const reportTemplateRoutes = require("./routes/reportTemplateRoutes");
const reportScheduleRoutes = require("./routes/reportScheduleRoutes");
const evaluationCriteriaRoutes = require("./routes/evaluationCriteriaRoutes");
const resourceRoutes = require("./routes/resourceRoutes");

const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware to log query parameters after parsing
app.use((req, res, next) => {
    console.log('Query parameters after middleware:', req.query);
    next();
});

// Dedicated test route for query parameters - placed early
app.get('/test-query', (req, res) => {
    console.log('Received query parameters in /test-query:', req.query);
    res.status(200).json({ receivedQuery: req.query });
});

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
app.use('/api/analytics/organization', organizationAnalyticsRoutes);
app.use('/api/analytics/personal', personalAnalyticsRoutes);
app.use('/api/analytics/team', teamAnalyticsRoutes);
app.use('/api/analytics/department', departmentAnalyticsRoutes);
app.use('/api/reports/personal', personalReportsRoutes);
app.use("/api/reports/team", teamReportsRoutes);
app.use("/api/reports", managerReportsRoutes);
app.use("/api/reports", departmentReportsRoutes);
app.use("/api/reports", reportTemplateRoutes);
app.use("/api/reports", reportScheduleRoutes);
app.use("/api/evaluationcriteria", evaluationCriteriaRoutes);
app.use("/api/resources", resourceRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
