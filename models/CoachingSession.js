const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CoachingSession = sequelize.define(
  "CoachingSession",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    supervisorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    employeeId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "completed",
        "cancelled",
        "rescheduled"
      ),
      allowNull: false,
      defaultValue: "scheduled",
    },
    goal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    topicTags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = CoachingSession;
