module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('feedback_followup_participants', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      followupId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'feedback_followups',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add a unique constraint to prevent duplicate participants
    await queryInterface.addConstraint('feedback_followup_participants', {
      fields: ['followupId', 'userId'],
      type: 'unique',
      name: 'unique_followup_participant'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('feedback_followup_participants');
  }
}; 