const {
  OnboardingProgress,
  User,
  Task,
  ChecklistAssignment,
  Checklist,
  ChecklistItem,
  ChecklistProgress,
  NotificationSettings,
  OnboardingTask,
  UserTaskProgress,
} = require("../models");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Parser } = require("json2csv");
const { v4: uuidv4 } = require("uuid");

// Employee: Get my onboarding progress
// GET /api/onboarding/journey
const getMyProgress = async (req, res) => {
  try {
    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.user.id },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Get tasks and checklist data if needed
    // (This can be expanded based on your specific requirements)

    res.json(progress);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Get onboarding progress for a specific employee
// GET /api/onboarding/journey/:userId
const getUserProgress = async (req, res) => {
  try {
    // Verify the user has permission to view this progress
    if (req.user.role !== "hr" && req.user.role !== "supervisor") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    res.json(progress);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR/Admin: Get all onboarding progresses
// GET /api/onboarding/progresses
const getAllProgresses = async (req, res) => {
  try {
    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const progresses = await OnboardingProgress.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    res.json(progresses);
  } catch (error) {
    console.error("Error fetching all onboarding progresses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Employee: Update my onboarding progress
// PUT /api/onboarding/journey
const updateMyProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.user.id },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Update progress with request data
    // Note: You might want to restrict what an employee can update
    const { progress: progressValue } = req.body;

    if (progressValue !== undefined) {
      await progress.update({ progress: progressValue });
    }

    const updatedProgress = await OnboardingProgress.findOne({
      where: { UserId: req.user.id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Update onboarding progress for an employee
// PUT /api/onboarding/journey/:userId
const updateUserProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "supervisor") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const progress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    const { stage, progress: progressValue } = req.body;

    // Update progress
    const updateData = {};
    if (stage) {
      updateData.stage = stage;
      updateData.stageStartDate = new Date();
      updateData.estimatedCompletionDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days from now
    }
    if (progressValue !== undefined) {
      updateData.progress = progressValue;
    }

    await progress.update(updateData);

    const updatedProgress = await OnboardingProgress.findOne({
      where: { UserId: req.params.userId },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's onboarding journey
const getUserJourney = async (req, res) => {
  try {
    // Check if we're getting a specific user's journey or the current user's
    const userId = req.params.userId || req.user.id;

    // Check permissions - only HR/supervisor can view others' journeys
    if (
      userId !== req.user.id &&
      !["hr", "supervisor"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this journey" });
    }

    // Get onboarding progress
    const progress = await OnboardingProgress.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Get assigned checklists
    const assignments = await ChecklistAssignment.findAll({
      where: { userId },
      include: [
        {
          model: Checklist,
          include: [
            {
              model: ChecklistItem,
              include: [
                {
                  model: ChecklistProgress,
                  where: { userId },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    // Group tasks by onboarding phase
    const phases = {
      prepare: {
        label: "PREPARE",
        description: "Pre-boarding and preparation",
        items: [],
        progress: 0,
      },
      orient: {
        label: "ORIENT",
        description: "Orientation and initial training",
        items: [],
        progress: 0,
      },
      land: {
        label: "LAND",
        description: "Integration into the role",
        items: [],
        progress: 0,
      },
      integrate: {
        label: "INTEGRATE",
        description: "Team integration and process familiarity",
        items: [],
        progress: 0,
      },
      excel: {
        label: "EXCEL",
        description: "Advanced training and development",
        items: [],
        progress: 0,
      },
    };

    // Organize items by phase
    assignments.forEach((assignment) => {
      if (assignment.Checklist && assignment.Checklist.ChecklistItems) {
        assignment.Checklist.ChecklistItems.forEach((item) => {
          if (phases[item.phase]) {
            const progress =
              item.ChecklistProgresses && item.ChecklistProgresses.length > 0
                ? item.ChecklistProgresses[0]
                : null;

            phases[item.phase].items.push({
              id: item.id,
              title: item.title,
              description: item.description,
              dueDate: item.dueDate,
              isCompleted: progress ? progress.isCompleted : false,
              completedAt: progress ? progress.completedAt : null,
              verificationStatus: progress
                ? progress.verificationStatus
                : "pending",
              verifiedAt: progress ? progress.verifiedAt : null,
              progressId: progress ? progress.id : null,
            });
          }
        });
      }
    });

    // Calculate progress for each phase
    Object.keys(phases).forEach((phase) => {
      const items = phases[phase].items;
      const totalItems = items.length;
      const completedItems = items.filter(
        (item) => item.isCompleted && item.verificationStatus === "approved"
      ).length;

      phases[phase].progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    });

    // Create response object
    const result = {
      userId,
      currentStage: progress.stage,
      stageStartDate: progress.stageStartDate,
      estimatedCompletionDate: progress.estimatedCompletionDate,
      user: progress.User,
      overallProgress: progress.progress,
      phases,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching onboarding journey:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get onboarding progress for a user
const getOnboardingProgress = async (req, res) => {
  try {
    const progress = await OnboardingProgress.findOne({
      where: { userId: req.params.id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Check if user has permission to view this progress
    if (req.user.role !== "hr" && req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this progress" });
    }

    // Get tasks for each onboarding stage
    const tasks = await Task.findAll({
      where: {
        userId: req.params.id,
        onboardingStage: {
          [Op.ne]: null,
        },
      },
    });

    // Group tasks by stage
    const tasksByStage = {
      prepare: tasks.filter((task) => task.onboardingStage === "prepare"),
      orient: tasks.filter((task) => task.onboardingStage === "orient"),
      land: tasks.filter((task) => task.onboardingStage === "land"),
      integrate: tasks.filter((task) => task.onboardingStage === "integrate"),
      excel: tasks.filter((task) => task.onboardingStage === "excel"),
    };

    // Add tasks to the response
    const result = progress.toJSON();
    result.tasks = tasksByStage;

    res.json(result);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update onboarding progress
const updateOnboardingProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const progress = await OnboardingProgress.findOne({
      where: { userId: req.params.id },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    const { stage, progress: progressValue } = req.body;

    // Update progress
    const updateData = {};
    if (stage) {
      updateData.stage = stage;
      updateData.stageStartDate = new Date();
      updateData.estimatedCompletionDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days from now
    }
    if (progressValue !== undefined) {
      updateData.progress = progressValue;
    }

    await progress.update(updateData);

    // Get updated progress
    const updatedProgress = await OnboardingProgress.findOne({
      where: { userId: req.params.id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "role", "department"],
        },
      ],
    });

    res.json(updatedProgress);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export onboarding progress as CSV
const exportOnboardingCSV = async (req, res) => {
  try {
    const progresses = await OnboardingProgress.findAll();
    const fields = ["userId", "stage", "progress", "createdAt", "updatedAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(progresses.map((p) => p.toJSON()));
    res.header("Content-Type", "text/csv");
    res.attachment("onboarding_report.csv");
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Failed to export onboarding progress" });
  }
};

// HR: Assign checklists to an employee
// POST /api/onboarding/checklists/assign
const assignChecklists = async (req, res) => {
  try {
    const { userId, checklistIds } = req.body;

    if (!userId || !checklistIds || !Array.isArray(checklistIds)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if checklists exist
    const checklists = await Checklist.findAll({
      where: { id: { [Op.in]: checklistIds } },
    });

    if (checklists.length !== checklistIds.length) {
      return res
        .status(400)
        .json({ message: "One or more checklists not found" });
    }

    // Create checklist assignments
    const assignments = [];
    for (const checklistId of checklistIds) {
      const [assignment, created] = await ChecklistAssignment.findOrCreate({
        where: { userId: userId, checklistId: checklistId },
        defaults: {
          id: uuidv4(),
          assignedBy: req.user.id,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "assigned",
          completionPercentage: 0,
          isAutoAssigned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      assignments.push(assignment);
    }

    res.status(201).json({
      message: "Checklists assigned successfully",
      assignments,
    });
  } catch (error) {
    console.error("Error assigning checklists:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Reset employee's journey
// POST /api/onboarding/journey/:userId/reset
const resetJourney = async (req, res) => {
  try {
    const { userId } = req.params;
    const { resetToStage = "prepare", keepCompletedTasks = false } = req.body;

    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find the user's onboarding progress
    const progress = await OnboardingProgress.findOne({
      where: { UserId: userId },
    });

    if (!progress) {
      return res.status(404).json({ message: "Onboarding progress not found" });
    }

    // Reset onboarding progress
    await progress.update({
      stage: resetToStage,
      progress: 0,
      stageStartDate: new Date(),
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // If not keeping completed tasks, reset task progress
    if (!keepCompletedTasks) {
      await UserTaskProgress.destroy({
        where: { UserId: userId },
      });
    }

    res.json({
      message: "Onboarding journey reset successfully",
      progress,
    });
  } catch (error) {
    console.error("Error resetting journey:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Get onboarding reports
// GET /api/reports/onboarding
const getOnboardingReports = async (req, res) => {
  try {
    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { department, role, startDateFrom, startDateTo } = req.query;

    // Build query filters
    const whereUser = {};
    if (department) whereUser.department = department;
    if (role) whereUser.role = role;

    if (startDateFrom || startDateTo) {
      whereUser.startDate = {};
      if (startDateFrom) whereUser.startDate[Op.gte] = new Date(startDateFrom);
      if (startDateTo) whereUser.startDate[Op.lte] = new Date(startDateTo);
    }

    // Get all onboarding progresses with user info
    const progresses = await OnboardingProgress.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "department",
            "startDate",
          ],
          where: Object.keys(whereUser).length > 0 ? whereUser : undefined,
        },
      ],
    });

    // Generate summary statistics
    const summary = {
      total: progresses.length,
      byStage: {
        prepare: progresses.filter((p) => p.stage === "prepare").length,
        orient: progresses.filter((p) => p.stage === "orient").length,
        land: progresses.filter((p) => p.stage === "land").length,
        integrate: progresses.filter((p) => p.stage === "integrate").length,
        excel: progresses.filter((p) => p.stage === "excel").length,
      },
      byProgress: {
        notStarted: progresses.filter((p) => p.progress === 0).length,
        inProgress: progresses.filter((p) => p.progress > 0 && p.progress < 100)
          .length,
        completed: progresses.filter((p) => p.progress === 100).length,
      },
      byDepartment: {},
      byRole: {},
    };

    // Group by department and role
    progresses.forEach((progress) => {
      if (progress.User) {
        // By department
        const dept = progress.User.department || "Unassigned";
        if (!summary.byDepartment[dept]) summary.byDepartment[dept] = 0;
        summary.byDepartment[dept]++;

        // By role
        const role = progress.User.role || "Unassigned";
        if (!summary.byRole[role]) summary.byRole[role] = 0;
        summary.byRole[role]++;
      }
    });

    res.json({
      summary,
      progresses,
    });
  } catch (error) {
    console.error("Error generating onboarding reports:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR: Update notification settings
// PUT /api/settings/notifications/onboarding
const updateNotificationSettings = async (req, res) => {
  try {
    // Verify the user has permission
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings data" });
    }

    // Get or create notification settings
    let [notificationSettings, created] =
      await NotificationSettings.findOrCreate({
        where: { userId: req.user.id, category: "onboarding" },
        defaults: {
          settings: settings,
        },
      });

    if (!created) {
      // Update existing settings
      await notificationSettings.update({
        settings: settings,
      });
    }

    res.json({
      message: "Notification settings updated successfully",
      settings: notificationSettings,
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/settings/notifications
const getNotificationSettings = async (req, res) => {
  try {
    const NotificationSettings = require('../models/NotificationSettings');
    let notificationSettings = await NotificationSettings.findOne({
      where: { userId: req.user.id, category: 'onboarding' }
    });
    if (!notificationSettings) {
      // Return default settings if not set
      notificationSettings = {
        settings: {
          taskCompletionHR: true,
          taskCompletionEmployee: true,
          stageTransition: true,
          delayAlerts: true,
          newAssignments: true
        }
      };
    }
    res.json(notificationSettings.settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/settings/notifications
const updateUserNotificationSettings = async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings data" });
    }
    let [notificationSettings, created] = await NotificationSettings.findOrCreate({
      where: { userId: req.user.id, category: "general" },
      defaults: { settings }
    });
    if (!created) {
      await notificationSettings.update({ settings });
    }
    res.json({
      message: "Notification settings updated successfully",
      settings: notificationSettings.settings
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getMyProgress,
  getUserProgress,
  getAllProgresses,
  updateMyProgress,
  updateUserProgress,
  getUserJourney,
  getOnboardingProgress,
  updateOnboardingProgress,
  exportOnboardingCSV,
  assignChecklists,
  resetJourney,
  getOnboardingReports,
  updateNotificationSettings,
  getNotificationSettings,
  updateUserNotificationSettings,
};
