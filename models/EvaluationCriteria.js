const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EvaluationCriteria = sequelize.define(
  "EvaluationCriteria",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    evaluationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Evaluations",
        key: "id",
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = EvaluationCriteria;
