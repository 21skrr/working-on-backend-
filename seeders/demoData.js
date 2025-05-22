const bcrypt = require("bcryptjs");
const {
  User,
  OnboardingProgress,
  Task,
  Event,
  EventParticipant,
  Course,
  UserCourse,
  Evaluation,
  EvaluationCriteria,
  Feedback,
  Document,
  DocumentAccess,
  Notification,
  Survey,
  SurveyQuestion,
  CoachingSession,
} = require("../models");
const sequelize = require("../config/database");

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Seed data
const seedData = async () => {
  try {
    console.log("Starting database seeding...");

    // Force sync database with foreign key checks disabled
    console.log("Syncing database...");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Database synced successfully");

    // Create users
    console.log("Creating users...");

    // Create HR user
    const hrPassword = await hashPassword("password");
    const hr = await User.create({
      name: "Maria HR",
      email: "hr@pmi.com",
      passwordHash: hrPassword,
      role: "hr",
      department: "Human Resources",
      startDate: "2022-01-01",
    });

    // Create manager
    const managerPassword = await hashPassword("password");
    const manager = await User.create({
      name: "Tom Manager",
      email: "manager@pmi.com",
      passwordHash: managerPassword,
      role: "manager",
      department: "Marketing",
      startDate: "2022-02-15",
    });

    // Create supervisor
    const supervisorPassword = await hashPassword("password");
    const supervisor = await User.create({
      name: "Sarah Supervisor",
      email: "supervisor@pmi.com",
      passwordHash: supervisorPassword,
      role: "supervisor",
      department: "Marketing",
      startDate: "2022-03-10",
    });

    // Create employees
    const employees = [];
    const programs = [
      "inkompass",
      "earlyTalent",
      "apprenticeship",
      "academicPlacement",
      "workExperience",
    ];
    const stages = ["prepare", "orient", "land", "integrate", "excel"];

    for (let i = 1; i <= 5; i++) {
      const employeePassword = await hashPassword("password");
      const program = programs[i - 1];
      const stage = stages[Math.min(i - 1, 4)]; // Different stages for different employees
      const progress = Math.min(i * 20, 100); // Different progress for different employees

      const employee = await User.create({
        name: `Employee ${i}`,
        email: `employee${i}@pmi.com`,
        passwordHash: employeePassword,
        role: "employee",
        department: "Marketing",
        startDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Different start dates
        programType: program,
        supervisorId: supervisor.id,
        onboardingProgress: progress,
      });

      employees.push(employee);

      // Create onboarding progress for each employee
      await OnboardingProgress.create({
        userId: employee.id,
        stage,
        progress,
        stageStartDate: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        estimatedCompletionDate: new Date(
          Date.now() + i * 30 * 24 * 60 * 60 * 1000
        ),
      });
    }

    // Create demo employee for login
    const demoEmployeePassword = await hashPassword("password");
    const demoEmployee = await User.create({
      name: "John Employee",
      email: "employee@pmi.com",
      passwordHash: demoEmployeePassword,
      role: "employee",
      department: "Marketing",
      startDate: "2023-04-15",
      programType: "earlyTalent",
      supervisorId: supervisor.id,
      onboardingProgress: 65,
    });

    // Create onboarding progress for demo employee
    await OnboardingProgress.create({
      userId: demoEmployee.id,
      stage: "land",
      progress: 65,
      stageStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      estimatedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    // Create tasks
    console.log("Creating tasks...");

    // Tasks for demo employee
    const tasks = [
      {
        userId: demoEmployee.id,
        title: "Complete onboarding documentation",
        description: "Review and sign all onboarding documents",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        isCompleted: true,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        priority: "high",
        onboardingStage: "prepare",
        controlledBy: "hr",
      },
      {
        userId: demoEmployee.id,
        title: "Schedule IT setup",
        description:
          "Contact IT to set up your work computer and access credentials",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        isCompleted: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: "high",
        onboardingStage: "prepare",
        controlledBy: "hr",
      },
      {
        userId: demoEmployee.id,
        title: "Team introduction meeting",
        description: "Attend introduction meeting with your team",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        priority: "medium",
        onboardingStage: "orient",
        controlledBy: "supervisor",
      },
      {
        userId: demoEmployee.id,
        title: "Complete compliance training",
        description: "Finish all required compliance training modules",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        priority: "medium",
        onboardingStage: "land",
        controlledBy: "hr",
      },
      {
        userId: demoEmployee.id,
        title: "First project assignment",
        description: "Start working on your first assigned project",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        priority: "low",
        onboardingStage: "integrate",
        controlledBy: "supervisor",
      },
    ];

    for (const task of tasks) {
      await Task.create(task);
    }

    // Create tasks for other employees
    for (const employee of employees) {
      for (let i = 0; i < 3; i++) {
        await Task.create({
          userId: employee.id,
          title: `Task ${i + 1} for ${employee.name}`,
          description: `Description of task ${i + 1}`,
          dueDate: new Date(Date.now() + (i + 1) * 3 * 24 * 60 * 60 * 1000),
          isCompleted: i === 0, // First task is completed
          completedAt:
            i === 0 ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
          priority: ["high", "medium", "low"][i],
          onboardingStage: stages[Math.min(i, 4)],
          controlledBy: ["hr", "supervisor", "manager"][i],
        });
      }
    }

    // Create events
    console.log("Creating events...");

    const events = [
      {
        title: "Company Orientation",
        description: "Introduction to PMI and its values",
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ),
        location: "Main Conference Room",
        type: "orientation",
        createdBy: hr.id,
      },
      {
        title: "Team Building Workshop",
        description: "Get to know your team members",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
        ),
        location: "Training Room 1",
        type: "training",
        createdBy: supervisor.id,
      },
      {
        title: "Product Knowledge Session",
        description: "Learn about PMI products and services",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
        location: "Training Room 2",
        type: "training",
        createdBy: manager.id,
      },
    ];

    for (const event of events) {
      const createdEvent = await Event.create(event);

      // Add participants
      await EventParticipant.create({
        eventId: createdEvent.id,
        userId: demoEmployee.id,
        attended: null,
      });

      // Add random employees as participants
      for (const employee of employees) {
        if (Math.random() > 0.5) {
          await EventParticipant.create({
            eventId: createdEvent.id,
            userId: employee.id,
            attended: null,
          });
        }
      }
    }

    // Create courses
    console.log("Creating courses...");

    const courses = [
      {
        title: "Introduction to PMI",
        description: "Basic overview of PMI as a company and its business",
        totalModules: 5,
        programType: "all",
        isRequired: true,
        createdBy: hr.id,
      },
      {
        title: "Compliance Training",
        description: "Essential compliance guidelines and policies",
        totalModules: 3,
        programType: "all",
        isRequired: true,
        createdBy: hr.id,
      },
      {
        title: "Marketing Fundamentals",
        description: "Core marketing principles and strategies",
        totalModules: 8,
        programType: "earlyTalent",
        isRequired: false,
        createdBy: manager.id,
      },
    ];

    for (const course of courses) {
      const createdCourse = await Course.create(course);

      // Assign courses to demo employee
      await UserCourse.create({
        userId: demoEmployee.id,
        courseId: createdCourse.id,
        progress: Math.floor(Math.random() * 100),
        modulesCompleted: Math.floor(
          Math.random() * createdCourse.totalModules
        ),
      });

      // Assign courses to random employees
      for (const employee of employees) {
        if (Math.random() > 0.5) {
          await UserCourse.create({
            userId: employee.id,
            courseId: createdCourse.id,
            progress: Math.floor(Math.random() * 100),
            modulesCompleted: Math.floor(
              Math.random() * createdCourse.totalModules
            ),
          });
        }
      }
    }

    // Create evaluations
    console.log("Creating evaluations...");

    // Create evaluation for demo employee
    const demoEvaluation = await Evaluation.create({
      employeeId: demoEmployee.id,
      supervisorId: supervisor.id,
      type: "3-month",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "pending",
      comments: "",
    });

    // Create evaluation criteria
    const criteria = [
      "Job Knowledge",
      "Communication Skills",
      "Team Collaboration",
      "Initiative",
      "Adaptability",
    ];

    for (const category of criteria) {
      await EvaluationCriteria.create({
        evaluationId: demoEvaluation.id,
        category,
        score: null,
        comments: null,
      });
    }

    // Create evaluations for other employees
    for (const employee of employees) {
      const evaluation = await Evaluation.create({
        employeeId: employee.id,
        supervisorId: supervisor.id,
        type: "3-month",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "pending",
        comments: "",
      });

      for (const category of criteria) {
        await EvaluationCriteria.create({
          evaluationId: evaluation.id,
          category,
          score: null,
          comments: null,
        });
      }
    }

    // Create feedback
    console.log("Creating feedback...");

    const feedbackMessages = [
      {
        fromUserId: demoEmployee.id,
        toUserId: supervisor.id,
        type: "onboarding",
        message:
          "The onboarding materials were very helpful and well-organized.",
        isAnonymous: false,
      },
      {
        fromUserId: supervisor.id,
        toUserId: demoEmployee.id,
        type: "performance",
        message: "Great job on your first assignments. Keep up the good work!",
        isAnonymous: false,
      },
      {
        fromUserId: demoEmployee.id,
        toDepartment: "Human Resources",
        type: "training",
        message:
          "The training sessions could benefit from more interactive elements.",
        isAnonymous: true,
      },
    ];

    for (const feedback of feedbackMessages) {
      await Feedback.create(feedback);
    }

    // Create coaching sessions
    console.log("Creating coaching sessions...");

    const coachingSessions = [
      {
        supervisorId: supervisor.id,
        employeeId: demoEmployee.id,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "scheduled",
        goal: "Review progress and discuss challenges",
        topicTags: ["progress", "challenges", "goals"],
      },
      {
        supervisorId: supervisor.id,
        employeeId: demoEmployee.id,
        scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: "completed",
        goal: "Initial onboarding feedback",
        notes: "Employee adjusting well to the team environment",
        outcome: "Set clear expectations for the first month",
        topicTags: ["onboarding", "feedback"],
      },
    ];

    for (const session of coachingSessions) {
      await CoachingSession.create(session);
    }

    // Create documents
    console.log("Creating documents...");

    const documents = [
      {
        name: "Employee Handbook",
        description: "Comprehensive guide to company policies and procedures",
        fileUrl: "/uploads/handbook.pdf",
        fileType: "application/pdf",
        fileSize: 2456789,
        category: "policy",
        uploadedBy: hr.id,
      },
      {
        name: "Onboarding Checklist",
        description: "List of tasks to complete during onboarding",
        fileUrl: "/uploads/checklist.pdf",
        fileType: "application/pdf",
        fileSize: 345678,
        category: "guide",
        uploadedBy: hr.id,
      },
      {
        name: "Employment Contract",
        description: "Legal employment agreement",
        fileUrl: "/uploads/contract.pdf",
        fileType: "application/pdf",
        fileSize: 567890,
        category: "contract",
        uploadedBy: hr.id,
      },
    ];

    for (const document of documents) {
      const createdDoc = await Document.create(document);

      // Set document access
      await DocumentAccess.create({
        documentId: createdDoc.id,
        roleAccess: "all",
        programAccess: "all",
      });
    }

    // Create notifications
    console.log("Creating notifications...");

    const notifications = [
      {
        userId: demoEmployee.id,
        title: "Welcome to PMI!",
        message:
          "We're excited to have you on board. Check out your onboarding dashboard to get started.",
        type: "info",
        isRead: true,
        link: "/dashboard",
      },
      {
        userId: demoEmployee.id,
        title: "New task assigned",
        message: "You have a new task: Complete compliance training",
        type: "info",
        isRead: false,
        link: "/tasks",
      },
      {
        userId: demoEmployee.id,
        title: "Upcoming event",
        message: "Don't forget: Company Orientation is scheduled for tomorrow",
        type: "warning",
        isRead: false,
        link: "/calendar",
      },
    ];

    for (const notification of notifications) {
      await Notification.create(notification);
    }

    // Create surveys
    console.log("Creating surveys...");

    const survey = await Survey.create({
      title: "3-Month Feedback Survey",
      description:
        "Please share your experience with the onboarding process so far",
      type: "3-month",
      status: "active",
      createdBy: hr.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targetRole: "employee",
      targetProgram: "all",
    });

    const questions = [
      {
        text: "How would you rate your overall onboarding experience?",
        type: "rating",
        isRequired: true,
        options: null,
      },
      {
        text: "What aspects of the onboarding process were most helpful?",
        type: "text",
        isRequired: true,
        options: null,
      },
      {
        text: "Which department do you feel provided the best support?",
        type: "multiple_choice",
        isRequired: true,
        options: JSON.stringify([
          "Human Resources",
          "IT",
          "Your Department",
          "Training Team",
        ]),
      },
      {
        text: "Do you feel you have the resources needed to perform your job effectively?",
        type: "multiple_choice",
        isRequired: true,
        options: JSON.stringify([
          "Yes, definitely",
          "Somewhat",
          "Not yet",
          "Not sure",
        ]),
      },
      {
        text: "What additional support would help you succeed in your role?",
        type: "text",
        isRequired: false,
        options: null,
      },
    ];

    for (let i = 0; i < questions.length; i++) {
      await SurveyQuestion.create({
        surveyId: survey.id,
        text: questions[i].text,
        type: questions[i].type,
        options: questions[i].options,
        isRequired: questions[i].isRequired,
        order: i,
      });
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

module.exports = seedData;

// Pour exécuter le seed
if (require.main === module) {
  seedData()
    .then(() => {
      console.log("Seeding completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
