const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SurveyQuestionResponse = sequelize.define(
  "SurveyQuestionResponse",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    surveyResponseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "SurveyResponses",
        key: "id",
      },
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "SurveyQuestions",
        key: "id",
      },
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ratingValue: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    selectedOption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = SurveyQuestionResponse;
