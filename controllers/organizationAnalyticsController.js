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
  analytics_dashboards
} = require("../models");
const { Op } = require("sequelize");

// Get organization-wide analytics dashboard
const getOrganizationDashboard = async (req, res) => {
  try {
    // Verify HR role
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    const dashboard = await analytics_dashboards.findOne({
      where: { type: 'organization' }
    });

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // Get metrics based on dashboard config
    const metrics = await analytics_metrics.findAll({
      where: { category: 'organization' }
    });

    // Compile dashboard data
    const dashboardData = {
      id: dashboard.id,
      name: dashboard.name,
      metrics: await Promise.all(metrics.map(async (metric) => {
        return {
          name: metric.name,
          value: await calculateMetric(metric),
          trend: await calculateMetricTrend(metric)
        };
      })),
      lastUpdated: new Date()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching organization dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get completion rates by department/program
const getCompletionRates = async (req, res) => {
  try {
    // Verify HR role
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    const { startDate, endDate, groupBy = 'department' } = req.query;

    let whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    let completionRates;
    if (groupBy === 'department') {
      completionRates = await Department.findAll({
        include: [{
          model: User,
          attributes: ['id'],
          include: [{
            model: Program,
            where: whereClause,
            attributes: ['id', 'status']
          }]
        }],
        attributes: [
          'name',
          [sequelize.fn('COUNT', sequelize.col('Users.Programs.id')), 'totalPrograms'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN Users.Programs.status = 'completed' THEN 1 ELSE 0 END")), 'completedPrograms']
        ],
        group: ['Department.id']
      });
    } else {
      completionRates = await Program.findAll({
        where: whereClause,
        attributes: [
          'name',
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalParticipants'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completedParticipants']
        ],
        group: ['Program.id']
      });
    }

    res.json(completionRates);
  } catch (error) {
    console.error('Error fetching completion rates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get feedback participation at 3, 6, 12 months
const getFeedbackParticipation = async (req, res) => {
  try {
    // Verify HR role
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    const milestones = [3, 6, 12]; // months
    const participation = {};

    for (const month of milestones) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - month);

      const totalEligible = await User.count({
        where: {
          createdAt: {
            [Op.lte]: startDate
          }
        }
      });

      const participated = await Feedback.count({
        distinct: true,
        col: 'fromUserId',
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        }
      });

      participation[`${month}_months`] = {
        totalEligible,
        participated,
        participationRate: totalEligible > 0 ? (participated / totalEligible) * 100 : 0
      };
    }

    res.json(participation);
  } catch (error) {
    console.error('Error fetching feedback participation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get survey response quality and trends
const getSurveyTrends = async (req, res) => {
  try {
    // Verify HR role
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    const { startDate, endDate } = req.query;

    let whereClause = {};
    if (startDate && endDate) {
      whereClause.submittedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const surveyMetrics = await SurveyResponse.findAll({
      where: whereClause,
      include: [{
        model: Survey,
        attributes: ['title', 'type']
      }],
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('submittedAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'responseCount'],
        [sequelize.fn('AVG', sequelize.col('completionTime')), 'avgCompletionTime'],
        [sequelize.fn('AVG', sequelize.col('responseQuality')), 'avgQuality']
      ],
      group: [
        sequelize.fn('DATE_TRUNC', 'month', sequelize.col('submittedAt')),
        'Survey.title',
        'Survey.type'
      ],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('submittedAt')), 'ASC']]
    });

    res.json(surveyMetrics);
  } catch (error) {
    console.error('Error fetching survey trends:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get training completion vs. role expectations
const getTrainingCompletion = async (req, res) => {
  try {
    // Verify HR role
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    const trainingMetrics = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalUsers'],
        [sequelize.fn('AVG', sequelize.col('Training.completionRate')), 'avgCompletionRate'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN Training.status = 'completed' THEN 1 ELSE 0 END")), 'completedTrainings']
      ],
      include: [{
        model: Training,
        attributes: []
      }],
      group: ['role']
    });

    // Get role expectations
    const roleExpectations = await getRoleTrainingExpectations();

    // Compare actual vs expected
    const comparisonMetrics = trainingMetrics.map(metric => ({
      role: metric.role,
      actualCompletion: metric.avgCompletionRate,
      expectedCompletion: roleExpectations[metric.role] || 100,
      variance: metric.avgCompletionRate - (roleExpectations[metric.role] || 100),
      totalUsers: metric.totalUsers,
      completedTrainings: metric.completedTrainings
    }));

    res.json(comparisonMetrics);
  } catch (error) {
    console.error('Error fetching training completion:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get evaluation and coaching effectiveness
const getEvaluationEffectiveness = async (req, res) => {
  try {
    // Verify HR role
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied. HR role required.' });
    }

    const { startDate, endDate } = req.query;

    let whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get evaluation metrics
    const evaluationMetrics = await Evaluation.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalEvaluations'],
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
        [sequelize.fn('AVG', sequelize.col('employeeSatisfaction')), 'avgSatisfaction'],
        [sequelize.fn('AVG', sequelize.col('supervisorRating')), 'avgSupervisorRating']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))]
    });

    // Get coaching effectiveness
    const coachingMetrics = await getCoachingEffectivenessMetrics(whereClause);

    res.json({
      evaluationMetrics,
      coachingMetrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching evaluation effectiveness:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate metric
const calculateMetric = async (metric) => {
  // Implement metric calculation logic based on metric.calculation_method
  // This is a placeholder implementation
  return 0;
};

// Helper function to calculate metric trend
const calculateMetricTrend = async (metric) => {
  // Implement trend calculation logic
  // This is a placeholder implementation
  return {
    direction: 'up',
    percentage: 0
  };
};

// Helper function to get role training expectations
const getRoleTrainingExpectations = async () => {
  // This could be fetched from a configuration table
  return {
    employee: 100,
    supervisor: 100,
    manager: 100,
    hr: 100
  };
};

// Helper function to get coaching effectiveness metrics
const getCoachingEffectivenessMetrics = async (whereClause) => {
  // Implement coaching effectiveness calculation
  // This is a placeholder implementation
  return {
    totalSessions: 0,
    averageEffectiveness: 0,
    improvementRate: 0
  };
};

module.exports = {
  getOrganizationDashboard,
  getCompletionRates,
  getFeedbackParticipation,
  getSurveyTrends,
  getTrainingCompletion,
  getEvaluationEffectiveness
}; 