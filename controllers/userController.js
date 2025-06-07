const express = require("express");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const models = require("../models");
const { User, ManagerPreference } = require("../models"); // Add User import
const scheduleFeedbackCyclesForUser = require("../utils/autoScheduleFeedback");

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["passwordHash"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["passwordHash"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has permission to view this user
    if (
      req.user.role !== "admin" &&
      req.user.role !== "hr" &&
      req.user.id !== req.params.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this user" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, startDate, programType } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password using SHA256
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      department,
      startDate,
      programType,
    });
    await scheduleFeedbackCyclesForUser(user);


    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has permission to update this user
    if (
      req.user.role !== "admin" &&
      req.user.role !== "hr" &&
      req.user.id !== req.params.id
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this user" });
    }

    const { name, email, password, role, department, startDate, programType } =
      req.body;

    // Update user
    const updateData = {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      department: department || user.department,
      startDate: startDate || user.startDate,
      programType: programType || user.programType,
    };

    // Only update password if provided
    if (password) {
      // Use SHA256 for password hashing to be consistent
      updateData.passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    }

    await user.update(updateData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get team members (supervisor/manager only)
const getTeamMembers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { supervisorId: req.user.id },
      attributes: { exclude: ["passwordHash"] },
      order: [["name", "ASC"]],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user settings by userId
const getUserSettings = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user.id; // Use ID from authenticated user
    // Authorization check is no longer needed here as the route is /me
    // const requestingUser = req.user;
    // if (requestingUser.id !== userId && !['hr', 'manager'].includes(requestingUser.role)) {
    //   return res.status(403).json({ message: "Forbidden: You can only view your own settings." });
    // }

    const userSettings = await models.UserSetting.findOne({
      where: { userId },
      include: [{ model: models.User, as: 'User', attributes: ['id', 'name', 'email'] }], // Include user details (optional)
    });

    if (!userSettings) {
       // Create default settings if they don't exist for this user
       const defaultSettings = await models.UserSetting.create({
         userId,
         // Default values will be applied from the model definition
       });
      return res.json(defaultSettings); // Return the newly created default settings
    }

    res.json(userSettings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user settings by userId
const updateUserSettings = async (req, res) => {
  try {
    // Get userId from authenticated user
    const userId = req.user.id; // Use ID from authenticated user
    // Authorization check is no longer needed here as the route is /me
    // const requestingUser = req.user;
    // if (requestingUser.id !== userId && !['hr', 'manager'].includes(requestingUser.role)) {
    //   return res.status(403).json({ message: "Forbidden: You can only update your own settings." });
    // }

    const userSettings = await models.UserSetting.findOne({
      where: { userId },
    });

    if (!userSettings) {
      // If settings don't exist, create them first with provided updates
      const updateData = { userId, ...req.body };
       const newSettings = await models.UserSetting.create(updateData);
       return res.json({ message: "User settings created and updated successfully.", userSettings: newSettings });
    }

    // Update fields from request body if they exist in the model and are allowed to be updated
    const allowedUpdates = ['emailNotifications', 'pushNotifications', 'profileVisibility', 'activityStatus', 'theme', 'compactMode'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        userSettings[field] = req.body[field];
      }
    });

    await userSettings.save(); // Save the updated settings

    res.json({ message: "User settings updated successfully.", userSettings });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get manager preferences for the authenticated manager
// @route   GET /api/users/managers/me/preferences
// @access  Private (Manager)
const getManagerPreferences = async (req, res) => {
  try {
    // Ensure the authenticated user is a manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden: Only managers can access manager preferences.' });
    }

    const userId = req.user.id;

    const managerPreferences = await models.ManagerPreference.findOne({
      where: { userId },
    });

    if (!managerPreferences) {
      // If preferences don't exist, create default settings for this manager
      const defaultPreferences = await models.ManagerPreference.create({
        userId,
        // Default values will be applied from the model definition
      });
      return res.json(defaultPreferences); // Return the newly created default preferences
    }

    res.json(managerPreferences);
  } catch (error) {
    console.error("Error fetching manager preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update manager preferences for the authenticated manager
// @route   PUT /api/users/managers/me/preferences
// @access  Private (Manager)
const updateManagerPreferences = async (req, res) => {
  try {
    // Ensure the authenticated user is a manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden: Only managers can update manager preferences.' });
    }

    const userId = req.user.id;

    let managerPreferences = await models.ManagerPreference.findOne({
      where: { userId },
    });

    if (!managerPreferences) {
      // If preferences don't exist, create them first with provided updates
      const updateData = { userId, ...req.body };
      const newPreferences = await models.ManagerPreference.create(updateData);
      return res.json({ message: "Manager preferences created and updated successfully.", managerPreferences: newPreferences });
    }

    // Update allowed fields from request body
    const allowedUpdates = ['alertThresholds', 'notificationFrequency']; // Add other fields as needed
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        managerPreferences[field] = req.body[field];
      }
    });

    await managerPreferences.save(); // Save the updated preferences

    res.json({ message: "Manager preferences updated successfully.", managerPreferences });
  } catch (error) {
    console.error("Error updating manager preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this function
const getUsersWithoutOnboarding = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: 'employee' // or whatever role should have onboarding
      },
      include: [{
        model: OnboardingProgress,
        required: false
      }],
      having: sequelize.literal('COUNT(OnboardingProgresses.id) = 0'),
      group: ['User.id']
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users without onboarding:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getTeamMembers,
  getUserSettings,
  updateUserSettings,
  getManagerPreferences,
  updateManagerPreferences,
};
