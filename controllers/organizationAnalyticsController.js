const {
  User,
  Program,
  Survey,
  SurveyResponse,
  Training,
  Evaluation,
  Feedback,
  Department,
  sequelize,
  analytics_metrics,
  analytics_dashboards,
  Team,
  OnboardingProgress,
  Task,
  Course,
  UserCourse,
  CoachingSession
} = require("../models");
const { Op } = require("sequelize");

// Organization-wide analytics dashboard
const getOrganizationDashboard = async (req, res) => {
  try {
    // Get overall statistics
    const totalUsers = await User.count();
    const departments = await Department.findAll();
    const totalTeams = await Team.count();
    
    // Get role distribution
    const roleBreakdown = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    // Get department-wise user count
    const departmentStats = await User.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    res.json({
      totalUsers,
      totalTeams,
      departments: departments.length,
      roleBreakdown,
      departmentStats
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Completion rates by department/program
const getCompletionRates = async (req, res) => {
  try {
    const departments = await Department.findAll();
    const result = await Promise.all(departments.map(async dept => {
      // Get users in department
      const users = await User.findAll({ where: { department: dept.name } });
      const userIds = users.map(u => u.id);

      // Onboarding completion
      const onboardingStats = await OnboardingProgress.findAll({
        where: { UserId: { [Op.in]: userIds } },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Training completion
      const trainingStats = await UserCourse.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      return {
        department: dept.name,
        totalUsers: users.length,
        onboarding: onboardingStats,
        training: trainingStats
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Feedback participation at 3, 6, 12 months
const getFeedbackParticipation = async (req, res) => {
  try {
    const departments = await Department.findAll();
    const result = await Promise.all(departments.map(async dept => {
      const users = await User.findAll({ where: { department: dept.name } });
      const userIds = users.map(u => u.id);

      // Get feedback counts by month intervals
      const threeMonths = await Feedback.count({
        where: {
          toUserId: { [Op.in]: userIds },
          createdAt: { [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        }
      });

      const sixMonths = await Feedback.count({
        where: {
          toUserId: { [Op.in]: userIds },
          createdAt: { [Op.gte]: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
        }
      });

      const twelveMonths = await Feedback.count({
        where: {
          toUserId: { [Op.in]: userIds },
          createdAt: { [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      });

      return {
        department: dept.name,
        totalUsers: users.length,
        feedbackParticipation: {
          threeMonths,
          sixMonths,
          twelveMonths
        }
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Survey response quality and trends
const getSurveyTrends = async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      include: [{
        model: SurveyResponse,
        attributes: [
          'rating',
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'responseCount']
        ],
        group: ['rating']
      }]
    });

    const result = surveys.map(survey => ({
      surveyId: survey.id,
      title: survey.title,
      totalResponses: survey.SurveyResponses.reduce((acc, resp) => acc + resp.responseCount, 0),
      averageRating: survey.SurveyResponses.reduce((acc, resp) => acc + (resp.rating * resp.responseCount), 0) / 
                    survey.SurveyResponses.reduce((acc, resp) => acc + resp.responseCount, 0),
      responseDistribution: survey.SurveyResponses.map(resp => ({
        rating: resp.rating,
        count: resp.responseCount
      }))
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Training completion vs. role expectations
const getTrainingCompletion = async (req, res) => {
  try {
    const roles = await User.findAll({
      attributes: ['role'],
      group: ['role']
    });

    const result = await Promise.all(roles.map(async role => {
      const users = await User.findAll({ where: { role: role.role } });
      const userIds = users.map(u => u.id);

      const courseStats = await UserCourse.findAll({
        where: { userId: { [Op.in]: userIds } },
        include: [{
          model: Course,
          attributes: ['title', 'requiredForRole']
        }],
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status', 'Course.requiredForRole'],
        raw: true
      });

      return {
        role: role.role,
        totalUsers: users.length,
        courseCompletion: courseStats
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Evaluation and coaching effectiveness
const getEvaluationEffectiveness = async (req, res) => {
  try {
    const departments = await Department.findAll();
    const result = await Promise.all(departments.map(async dept => {
      const users = await User.findAll({ where: { department: dept.name } });
      const userIds = users.map(u => u.id);

      // Evaluation effectiveness
      const evaluations = await Evaluation.findAll({
        where: { employeeId: { [Op.in]: userIds } },
        attributes: [
          'status',
          'rating',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status', 'rating'],
        raw: true
      });

      // Coaching effectiveness
      const coachingSessions = await CoachingSession.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: [
          'status',
          'effectiveness',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status', 'effectiveness'],
        raw: true
      });

      return {
        department: dept.name,
        totalUsers: users.length,
        evaluations,
        coachingSessions
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrganizationDashboard,
  getCompletionRates,
  getFeedbackParticipation,
  getSurveyTrends,
  getTrainingCompletion,
  getEvaluationEffectiveness
}; 