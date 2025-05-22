'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the phase column if it doesn't exist
    await queryInterface.addColumn('ChecklistItems', 'phase', {
      type: Sequelize.ENUM('prepare', 'orient', 'land', 'integrate', 'excel'),
      allowNull: false,
      defaultValue: 'prepare'
    }).catch(err => {
      // Column might already exist, ignore error
      console.log('Phase column already exists or another error:', err.message);
    });

    // Update existing records - distribute items evenly across phases
    const items = await queryInterface.sequelize.query(
      'SELECT id, orderIndex FROM ChecklistItems ORDER BY checklistId, orderIndex',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const phases = ['prepare', 'orient', 'land', 'integrate', 'excel'];
    
    // Update items in batches
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const phase = phases[i % phases.length]; // Distribute evenly
      
      await queryInterface.sequelize.query(
        `UPDATE ChecklistItems SET phase = '${phase}' WHERE id = '${item.id}'`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the phase column
    await queryInterface.removeColumn('ChecklistItems', 'phase');
  }
}; 