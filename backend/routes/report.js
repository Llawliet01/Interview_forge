const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.post('/generate/:interviewId', auth, reportController.generateReport);
router.get('/history', auth, reportController.getReportsHistory);
router.get('/interview/:interviewId', auth, reportController.getReportByInterviewId);
router.get('/roadmap', auth, reportController.getRoadmap);

module.exports = router;
