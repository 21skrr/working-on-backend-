"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key for eventId
    await queryInterface.addConstraint("EventParticipants", {
      fields: ["eventId"],
      type: "foreign key",
      name: "EventParticipants_eventId_Events_fk",
      references: {
        table: "Events",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Add foreign key for userId
    await queryInterface.addConstraint("EventParticipants", {
      fields: ["userId"],
      type: "foreign key",
      name: "EventParticipants_userId_Users_fk",
      references: {
        table: "Users",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraints
    await queryInterface
      .removeConstraint(
        "EventParticipants",
        "EventParticipants_eventId_Events_fk"
      )
      .catch(() => {}); // Ignore error if constraint doesn't exist
    await queryInterface
      .removeConstraint(
        "EventParticipants",
        "EventParticipants_userId_Users_fk"
      )
      .catch(() => {}); // Ignore error if constraint doesn't exist
  },
};
