const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Feedback = sequelize.define(
  "Feedback",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    fromUserId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    toUserId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    },
    toDepartment: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM("onboarding", "training", "support", "general"),
      allowNull: false,
      defaultValue: "general"
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    tableName: "feedback",
    modelName: "Feedback",
    timestamps: true
  }
);

Feedback.associate = (models) => {
  Feedback.belongsTo(models.User, {
    foreignKey: "fromUserId",
    as: "fromUser"
  });

  Feedback.belongsTo(models.User, {
    foreignKey: "toUserId",
    as: "toUser"
  });

  Feedback.hasMany(models.FeedbackNote, {
    foreignKey: "feedbackId",
    as: "notes"
  });
};

module.exports = Feedback;
