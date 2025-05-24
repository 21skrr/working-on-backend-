module.exports = (sequelize, DataTypes) => {
  const NotificationTemplate = sequelize.define(
    "NotificationTemplate",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
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
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      timestamps: true,
    }
  );

  NotificationTemplate.associate = (models) => {
    NotificationTemplate.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
  };

  return NotificationTemplate;
}; 