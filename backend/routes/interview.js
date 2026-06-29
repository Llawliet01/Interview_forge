const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const auth = require('../middleware/auth');

router.post('/generate-interview', auth, interviewController.generateInterview);
router.get('/:id', auth, interviewController.getInterview);
router.post('/:id/run-code', auth, interviewController.runCode);
router.post('/:id/submit-code', auth, interviewController.submitCode);
router.post('/:id/ai-assist', auth, interviewController.getAiAssist);

module.exports = router;
