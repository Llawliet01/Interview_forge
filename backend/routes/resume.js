const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');
const auth = require('../middleware/auth');

// Multer memory storage configuration for receiving resume PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF format is supported.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

router.post('/upload-resume', auth, upload.single('resume'), resumeController.uploadResume);
router.get('/resume', auth, resumeController.getResume);
router.post('/calculate-ats', auth, resumeController.calculateAts);

module.exports = router;
