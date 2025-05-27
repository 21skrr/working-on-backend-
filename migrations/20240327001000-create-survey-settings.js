'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_settings', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      defaultAnonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allowComments: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      requireEvidence: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      autoReminders: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      reminderFrequency: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
      },
      responseDeadlineDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 14,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });

    // Add default settings
    await queryInterface.bulkInsert('survey_settings', [{
      id: Sequelize.UUIDV4(),
      defaultAnonymous: false,
      allowComments: true,
      requireEvidence: false,
      autoReminders: true,
      reminderFrequency: 7,
      responseDeadlineDays: 14,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_settings');
  }
}; 