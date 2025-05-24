module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create FeedbackForm table
    await queryInterface.createTable('FeedbackForms', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('3month', '6month', '12month', 'custom'),
        allowNull: false
      },
      description: Sequelize.TEXT,
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      questions: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create FeedbackSubmission table
    await queryInterface.createTable('FeedbackSubmissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      formId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'FeedbackForms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      submitterId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'reviewed'),
        defaultValue: 'draft'
      },
      responseData: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      submittedAt: Sequelize.DATE,
      reviewedAt: Sequelize.DATE,
      reviewerId: {
        type: Sequelize.STRING(36),
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewComments: Sequelize.TEXT,
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FeedbackSubmissions');
    await queryInterface.dropTable('FeedbackForms');
  }
}; 