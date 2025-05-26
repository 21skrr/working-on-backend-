'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('feedback', 'categories', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('feedback', 'priority', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      allowNull: true
    });

    // Update status field to include new statuses
    await queryInterface.changeColumn('feedback', 'status', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('feedback', 'categories');
    await queryInterface.removeColumn('feedback', 'priority');
    
    // Remove the ENUM type after removing the column
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_feedback_priority;');
  }
}; 