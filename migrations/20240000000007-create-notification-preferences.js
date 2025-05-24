'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('NotificationPreferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      emailNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      pushNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notificationTypes: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
          reminder: true,
          document: true,
          training: true,
          coaching_session: true,
          team_progress: true,
          overdue_task: true,
          feedback_availability: true,
          feedback_submission: true,
          weekly_report: true,
          compliance: true,
          leave_request: true
        },
      },
      quietHours: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          enabled: false,
          start: "22:00",
          end: "06:00",
          timezone: "UTC"
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index for faster lookups
    await queryInterface.addIndex('NotificationPreferences', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('NotificationPreferences');
  }
}; 