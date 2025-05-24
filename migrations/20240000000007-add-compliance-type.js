'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Modify the ENUM type to include compliance
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM('task', 'event', 'evaluation', 'feedback', 'system', 'weekly_report', 'compliance') 
      NOT NULL DEFAULT 'system'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert ENUM type
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM('task', 'event', 'evaluation', 'feedback', 'system', 'weekly_report') 
      NOT NULL DEFAULT 'system'
    `);
  }
}; 