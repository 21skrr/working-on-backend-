const { Task, User, UserTaskProgress } = require("../models");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

// Get user's tasks
const getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [["dueDate", "ASC"]],
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create task
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      dueDate,
      priority,
      onboardingStage,
      controlledBy,
    } = req.body;
    const task = await Task.create({
      userId: req.user.id,
      title,
      description,
      dueDate,
      priority,
      onboardingStage,
      controlledBy,
      isCompleted: false,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const {
      title,
      description,
      dueDate,
      priority,
      onboardingStage,
      controlledBy,
      isCompleted,
    } = req.body;
    await task.update({
      title: title || task.title,
      description: description || task.description,
      dueDate: dueDate || task.dueDate,
      priority: priority || task.priority,
      onboardingStage: onboardingStage || task.onboardingStage,
      controlledBy: controlledBy || task.controlledBy,
      isCompleted: isCompleted !== undefined ? isCompleted : task.isCompleted,
    });

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get employee tasks (for supervisors/managers/HR)
const getEmployeeTasks = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check if employee exists
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if user has permission to view employee's tasks
    if (
      req.user.role === "supervisor" &&
      employee.supervisorId !== req.user.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this employee's tasks" });
    }

    const tasks = await Task.findAll({
      where: { userId: employeeId },
      order: [["dueDate", "ASC"]],
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// NEW METHODS

// Update task progress
// PUT /api/onboarding/tasks/:taskId/progress
const updateTaskProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { isCompleted, notes } = req.body;
    const userId = req.user.id;

    // Check if task exists and is assigned to this user
    const task = await Task.findOne({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found or not assigned to you" });
    }

    // Update the task
    await task.update({
      isCompleted: isCompleted,
    });

    // Check if UserTaskProgress exists for this task
    let taskProgress = await UserTaskProgress.findOne({
      where: {
        OnboardingTaskId: taskId,
        UserId: userId,
      },
    });

    // Create or update task progress
    if (!taskProgress) {
      taskProgress = await UserTaskProgress.create({
        id: uuidv4(),
        UserId: userId,
        OnboardingTaskId: taskId,
        isCompleted: isCompleted,
        notes: notes || null,
        completedAt: isCompleted ? new Date() : null,
      });
    } else {
      await taskProgress.update({
        isCompleted: isCompleted,
        notes: notes || taskProgress.notes,
        completedAt: isCompleted ? new Date() : taskProgress.completedAt,
      });
    }

    res.json({
      task,
      progress: taskProgress,
    });
  } catch (error) {
    console.error("Error updating task progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add supervisor notes to task
// PUT /api/onboarding/tasks/:taskId/notes
const addSupervisorNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { supervisorNotes } = req.body;
    const supervisorId = req.user.id;

    // Find the task
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify supervisor relationship with the task owner
    const taskOwner = await User.findByPk(task.userId);
    if (!taskOwner) {
      return res.status(404).json({ message: "Task owner not found" });
    }

    // Check if supervisor has permission
    if (
      req.user.role === "supervisor" &&
      taskOwner.supervisorId !== supervisorId &&
      req.user.role !== "hr" &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({
        message: "Not authorized to add notes to this employee's tasks",
      });
    }

    // Update the task with supervisor notes
    await task.update({
      supervisorNotes: supervisorNotes,
    });

    res.json({
      task,
    });
  } catch (error) {
    console.error("Error adding supervisor notes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUserTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getEmployeeTasks,
  updateTaskProgress,
  addSupervisorNotes,
};
