'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('feedback', 'status', {
      type: Sequelize.ENUM('pending', 'addressed', 'in_progress'),
      allowNull: false,
      defaultValue: 'pending'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('feedback', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_feedback_status";');
  }
}; 