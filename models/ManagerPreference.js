const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ManagerPreference = sequelize.define(
    "ManagerPreference",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        binary: true,
      },
      alertThresholds: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      notificationFrequency: {
        type: DataTypes.STRING, // Can use ENUM if specific values are required
        defaultValue: "daily",
      },
    },
    {
      tableName: "managerpreferences", // Adjust table name if needed
      timestamps: true,
    }
  );

  ManagerPreference.associate = (models) => {
    ManagerPreference.belongsTo(models.User, {
      foreignKey: "userId",
      as: "manager",
    });
  };

  return ManagerPreference;
}; 