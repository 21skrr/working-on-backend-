const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeedbackNote = sequelize.define("feedback_notes", {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  feedbackId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: "feedback",
      key: "id",
    }
  },
  supervisorId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    }
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("pending", "in-progress", "completed"),
    allowNull: true,
    defaultValue: "pending"
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
  }
}, {
  tableName: "feedback_notes",
  timestamps: false
});

// Define associations
FeedbackNote.associate = (models) => {
  FeedbackNote.belongsTo(models.Feedback, {
    foreignKey: "feedbackId",
    as: "feedback",
    onDelete: "CASCADE"
  });
  FeedbackNote.belongsTo(models.User, {
    foreignKey: "supervisorId",
    as: "supervisor",
    onDelete: "CASCADE"
  });
};

module.exports = FeedbackNote;
