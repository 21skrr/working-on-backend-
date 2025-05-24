'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, modify the ENUM type to include weekly_report
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM('task', 'event', 'evaluation', 'feedback', 'system', 'weekly_report') 
      NOT NULL DEFAULT 'system'
    `);

    // Then add the metadata column
    await queryInterface.addColumn('Notifications', 'metadata', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove metadata column
    await queryInterface.removeColumn('Notifications', 'metadata');

    // Revert ENUM type
    await queryInterface.sequelize.query(`
      ALTER TABLE Notifications 
      MODIFY COLUMN type ENUM('task', 'event', 'evaluation', 'feedback', 'system') 
      NOT NULL DEFAULT 'system'
    `);
  }
}; 