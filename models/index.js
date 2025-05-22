const sequelize = require("../config/database");
const User = require("./User");
const OnboardingProgress = require("./OnboardingProgress");
const Task = require("./Task");
const Event = require("./Event");
const Course = require("./Course");
const Survey = require("./Survey");
const EventParticipant = require("./EventParticipant");
const CoachingSession = require("./CoachingSession");
const Evaluation = require("./Evaluation");
const Feedback = require("./Feedback");
const Team = require("./Team");
const Program = require("./Program");
const Checklist = require("./Checklist");
const ChecklistItem = require("./ChecklistItem");
const ChecklistProgress = require("./ChecklistProgress");
const ChecklistAssignment = require("./ChecklistAssignment");
const NotificationSettings = require("./NotificationSettings");
const OnboardingTask = require("./OnboardingTask");
const UserTaskProgress = require("./UserTaskProgress")(sequelize);

// User associations
User.hasOne(OnboardingProgress);
OnboardingProgress.belongsTo(User);

User.hasMany(Task, { foreignKey: "userId" });
Task.belongsTo(User, { foreignKey: "userId" });

// Event associations
User.hasMany(Event, { as: "createdEvents", foreignKey: "createdBy" });
Event.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

// Event Participant associations
Event.hasMany(EventParticipant, { as: "participants", foreignKey: "eventId" });
EventParticipant.belongsTo(Event, { as: "event", foreignKey: "eventId" });
User.hasMany(EventParticipant, {
  as: "eventParticipations",
  foreignKey: "userId",
});
EventParticipant.belongsTo(User, { as: "participant", foreignKey: "userId" });

User.hasMany(Course, { as: "createdCourses", foreignKey: "createdBy" });
Course.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

User.hasMany(Survey, { as: "createdSurveys", foreignKey: "createdBy" });
Survey.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

// Checklist associations
User.hasMany(Checklist, { as: "createdChecklists", foreignKey: "createdBy" });
Checklist.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

// Checklist Items associations
Checklist.hasMany(ChecklistItem, { foreignKey: "checklistId" });
ChecklistItem.belongsTo(Checklist, { foreignKey: "checklistId" });

// Checklist Progress associations
User.hasMany(ChecklistProgress, {
  as: "checklistProgress",
  foreignKey: "userId",
});
ChecklistProgress.belongsTo(User, { as: "user", foreignKey: "userId" });

ChecklistItem.hasMany(ChecklistProgress, { foreignKey: "checklistItemId" });
ChecklistProgress.belongsTo(ChecklistItem, { foreignKey: "checklistItemId" });

User.hasMany(ChecklistProgress, {
  as: "verifiedChecklistItems",
  foreignKey: "verifiedBy",
});
ChecklistProgress.belongsTo(User, { as: "verifier", foreignKey: "verifiedBy" });

// Checklist Assignment associations
Checklist.hasMany(ChecklistAssignment, { foreignKey: "checklistId" });
ChecklistAssignment.belongsTo(Checklist, { foreignKey: "checklistId" });

User.hasMany(ChecklistAssignment, {
  as: "assignedChecklists",
  foreignKey: "userId",
});
ChecklistAssignment.belongsTo(User, { as: "assignee", foreignKey: "userId" });

User.hasMany(ChecklistAssignment, {
  as: "checklistAssignments",
  foreignKey: "assignedBy",
});
ChecklistAssignment.belongsTo(User, {
  as: "assigner",
  foreignKey: "assignedBy",
});

// Self-referential association for supervisor
User.belongsTo(User, { as: "supervisor", foreignKey: "supervisorId" });
User.hasMany(User, { as: "subordinates", foreignKey: "supervisorId" });

// Coaching Session associations
User.hasMany(CoachingSession, {
  as: "supervisorSessions",
  foreignKey: "supervisorId",
});
User.hasMany(CoachingSession, {
  as: "employeeSessions",
  foreignKey: "employeeId",
});
CoachingSession.belongsTo(User, {
  as: "supervisor",
  foreignKey: "supervisorId",
});
CoachingSession.belongsTo(User, { as: "employee", foreignKey: "employeeId" });

// Evaluation associations
User.hasMany(Evaluation, {
  as: "employeeEvaluations",
  foreignKey: "employeeId",
});
User.hasMany(Evaluation, {
  as: "supervisorEvaluations",
  foreignKey: "supervisorId",
});
User.hasMany(Evaluation, {
  as: "reviewerEvaluations",
  foreignKey: "reviewedBy",
});
Evaluation.belongsTo(User, { as: "employee", foreignKey: "employeeId" });
Evaluation.belongsTo(User, { as: "supervisor", foreignKey: "supervisorId" });
Evaluation.belongsTo(User, { as: "reviewer", foreignKey: "reviewedBy" });

// Feedback associations
User.hasMany(Feedback, { as: "sentFeedback", foreignKey: "fromUserId" });
User.hasMany(Feedback, { as: "receivedFeedback", foreignKey: "toUserId" });
Feedback.belongsTo(User, { as: "sender", foreignKey: "fromUserId" });
Feedback.belongsTo(User, { as: "receiver", foreignKey: "toUserId" });

// Team associations
User.belongsTo(Team, { foreignKey: "teamId" });
Team.hasMany(User, { foreignKey: "teamId" });

// Notification settings association
User.hasMany(NotificationSettings);
NotificationSettings.belongsTo(User);

// OnboardingTask associations
OnboardingTask.hasMany(UserTaskProgress, { foreignKey: "OnboardingTaskId" });

// UserTaskProgress associations - These are now defined in the model itself

// Export models and connection
module.exports = {
  sequelize,
  User,
  OnboardingProgress,
  Task,
  Event,
  EventParticipant,
  Course,
  Survey,
  CoachingSession,
  Evaluation,
  Feedback,
  Team,
  Program,
  Checklist,
  ChecklistItem,
  ChecklistProgress,
  ChecklistAssignment,
  NotificationSettings,
  OnboardingTask,
  UserTaskProgress,
};
