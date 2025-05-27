const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
  getOrganizationDashboard,
  getCompletionRates,
  getFeedbackParticipation,
  getSurveyTrends,
  getTrainingCompletion,
  getEvaluationEffectiveness
} = require('../controllers/organizationAnalyticsController');

// Use checkRole instead of authorize
router.get('/dashboard', auth, checkRole('hr'), getOrganizationDashboard);
router.get('/completion-rates', auth, checkRole('hr'), getCompletionRates);
router.get('/feedback-participation', auth, checkRole('hr'), getFeedbackParticipation);
router.get('/survey-trends', auth, checkRole('hr'), getSurveyTrends);
router.get('/training-completion', auth, checkRole('hr'), getTrainingCompletion);
router.get('/evaluation-effectiveness', auth, checkRole('hr'), getEvaluationEffectiveness);

module.exports = router;
