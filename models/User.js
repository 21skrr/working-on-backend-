const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('employee', 'supervisor', 'manager', 'hr'),
      allowNull: false
    },
    department: DataTypes.STRING,
    startDate: DataTypes.DATE,
    programType: DataTypes.ENUM('inkompass', 'earlyTalent', 'apprenticeship', 'academicPlacement', 'workExperience'),
    supervisorId: DataTypes.UUID,
    teamId: DataTypes.INTEGER
  },
  {
    timestamps: true,
  }
);

User.associate = (models) => {
  // User belongs to a supervisor
  User.belongsTo(models.User, {
    as: 'supervisor',
    foreignKey: 'supervisorId'
  });

  // User has many subordinates
  User.hasMany(models.User, {
    as: 'subordinates',
    foreignKey: 'supervisorId'
  });

  // User belongs to a team
  User.belongsTo(models.Team, {
    foreignKey: 'teamId'
  });

  // User has one onboarding progress
  User.hasOne(models.OnboardingProgress, {
    foreignKey: 'UserId'
  });

  // User has many checklist assignments
  User.hasMany(models.ChecklistAssignment, {
    foreignKey: 'userId',
    as: 'assignedChecklists'
  });

  // User has many tasks
  User.hasMany(models.Task, {
    foreignKey: 'userId',
    as: 'Tasks'
  });

  // User has many feedback submissions as submitter
  User.hasMany(models.FeedbackSubmission, {
    foreignKey: 'submitterId',
    as: 'submittedFeedbacks'
  });

  // User has many feedback submissions as reviewer
  User.hasMany(models.FeedbackSubmission, {
    foreignKey: 'reviewerId',
    as: 'reviewedFeedbacks'
  });
};

// Instance method to check password
User.prototype.checkPassword = function (password) {
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  return hashedPassword === this.passwordHash;
};

module.exports = User;
