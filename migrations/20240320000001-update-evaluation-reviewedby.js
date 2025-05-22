"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check if the column exists
    const tableInfo = await queryInterface.describeTable("Evaluations");

    if (tableInfo.reviewedBy) {
      // If column exists, modify it
      await queryInterface.changeColumn("Evaluations", "reviewedBy", {
        type: Sequelize.CHAR(36),
        allowNull: true,
      });
    } else {
      // If column doesn't exist, add it
      await queryInterface.addColumn("Evaluations", "reviewedBy", {
        type: Sequelize.CHAR(36),
        allowNull: true,
      });
    }

    // Add foreign key constraint
    try {
      await queryInterface.addConstraint("Evaluations", {
        fields: ["reviewedBy"],
        type: "foreign key",
        name: "Evaluations_reviewedBy_Users_fk",
        references: {
          table: "Users",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    } catch (error) {
      console.log(
        "Foreign key constraint already exists or could not be added"
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint if it exists
    try {
      await queryInterface.removeConstraint(
        "Evaluations",
        "Evaluations_reviewedBy_Users_fk"
      );
    } catch (error) {
      console.log("Foreign key constraint does not exist");
    }

    // Change column back to UUID
    await queryInterface.changeColumn("Evaluations", "reviewedBy", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },
};
