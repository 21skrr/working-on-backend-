'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_schedules', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      surveyId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'surveys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      scheduleType: {
        type: Sequelize.ENUM('one-time', 'recurring'),
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      frequency: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      targetAudience: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('survey_schedules', ['surveyId']);
    await queryInterface.addIndex('survey_schedules', ['scheduleType']);
    await queryInterface.addIndex('survey_schedules', ['startDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_schedules');
  }
}; 