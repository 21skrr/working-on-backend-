const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getOrganizationDashboard,
  getCompletionRates,
  getFeedbackParticipation,
  getSurveyTrends,
  getTrainingCompletion,
  getEvaluationEffectiveness
} = require('../controllers/organizationAnalyticsController');

// HR organization-wide analytics routes
router.get('/dashboard', auth, getOrganizationDashboard);
router.get('/completion-rates', auth, getCompletionRates);
router.get('/feedback-participation', auth, getFeedbackParticipation);
router.get('/survey-trends', auth, getSurveyTrends);
router.get('/training-completion', auth, getTrainingCompletion);
router.get('/evaluation-effectiveness', auth, getEvaluationEffectiveness);

module.exports = router;
