'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First modify the enum to include the new type
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM(
        'reminder',
        'document',
        'training',
        'coaching_session',
        'team_progress',
        'overdue_task',
        'feedback_availability',
        'feedback_submission',
        'weekly_report',
        'compliance',
        'leave_request'
      ) NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the enum to its previous state
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM(
        'reminder',
        'document',
        'training',
        'coaching_session',
        'team_progress',
        'overdue_task',
        'feedback_availability',
        'feedback_submission',
        'weekly_report',
        'compliance'
      ) NOT NULL;
    `);
  }
}; 