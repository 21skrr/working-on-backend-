const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Assuming auth middleware is available
const managerReportsController = require('../controllers/managerReportsController');

// Manager Reports Endpoints (require authentication and appropriate role check)
router.get('/supervisor-activity', auth, managerReportsController.getSupervisorActivityReport);
router.get('/onboarding-health', auth, managerReportsController.getOnboardingHealthReport);

module.exports = router; 