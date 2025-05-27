'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('surveys', 'isTemplate', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Update existing survey templates to have isTemplate = true
    await queryInterface.sequelize.query(`
      UPDATE surveys 
      SET isTemplate = true 
      WHERE type IN ('3-month', '6-month', '12-month', 'training', 'general')
      AND status = 'draft'
      AND title LIKE '%Template%'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('surveys', 'isTemplate');
  }
}; 