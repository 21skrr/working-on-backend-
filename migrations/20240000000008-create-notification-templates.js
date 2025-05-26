'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notificationtemplates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
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
        ),
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Add indexes
    await queryInterface.addIndex('notificationtemplates', ['type']);
    await queryInterface.addIndex('notificationtemplates', ['isActive']);
    await queryInterface.addIndex('notificationtemplates', ['createdBy']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notificationtemplates');
  }
}; 