const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Survey = sequelize.define(
  "Survey",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "3-month",
        "6-month",
        "12-month",
        "training",
        "general"
      ),
      defaultValue: "general",
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "completed"),
      defaultValue: "draft",
    },
    createdBy: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    targetRole: {
      type: DataTypes.ENUM("employee", "supervisor", "manager", "hr", "all"),
      defaultValue: "employee",
    },
    targetProgram: {
      type: DataTypes.ENUM(
        "inkompass",
        "earlyTalent",
        "apprenticeship",
        "academicPlacement",
        "workExperience",
        "all"
      ),
      defaultValue: "all",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Survey;
