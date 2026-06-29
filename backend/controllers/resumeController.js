const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const geminiService = require('../services/geminiService');

// @route   POST api/resume/upload
// @desc    Upload PDF resume, parse and analyze with Gemini
// @access  Private
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded or invalid format. Please upload a PDF resume.' });
    }

    console.log(`Parsing PDF file: ${req.file.originalname} (${req.file.size} bytes)...`);

    // Parse the PDF buffer to text
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ msg: 'Could not extract text from the PDF. Make sure it is not a scanned image.' });
    }

    console.log('Sending text to Gemini for skill extraction...');
    // Analyze resume text using Gemini Service
    const analysis = await geminiService.analyzeResume(resumeText);

    // Save/Update in DB
    let resume = await Resume.findOne({ userId: req.user.id });

    if (resume) {
      resume.skills = analysis.skills || [];
      resume.projects = analysis.projects || [];
      resume.experience = analysis.experience || [];
      resume.education = analysis.education || [];
      resume.additionalInfo = analysis.additionalInfo || {
        contact: { email: null, phone: null, location: null, links: [] },
        certifications: [],
        achievements: []
      };
      resume.rawText = resumeText;
    } else {
      resume = new Resume({
        userId: req.user.id,
        skills: analysis.skills || [],
        projects: analysis.projects || [],
        experience: analysis.experience || [],
        education: analysis.education || [],
        additionalInfo: analysis.additionalInfo || {
          contact: { email: null, phone: null, location: null, links: [] },
          certifications: [],
          achievements: []
        },
        rawText: resumeText
      });
    }

    await resume.save();
    res.json(resume);
  } catch (error) {
    console.error('Resume processing error:', error.message);
    res.status(500).json({ msg: 'Error processing resume PDF file.' });
  }
};

// @route   GET api/resume
// @desc    Get user's parsed resume details
// @access  Private
exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ msg: 'No resume found for this user.' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Resume fetching error:', error.message);
    res.status(500).send('Server error');
  }
};

// --- Local ATS Scoring System ---
const TECH_DICTIONARY = [
  'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'golang', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'c',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', 'laravel', 'nest.js',
  'mongodb', 'postgresql', 'mysql', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'graphql', 'rest api', 'ci/cd', 'firebase', 'nginx',
  'machine learning', 'deep learning', 'data structures', 'algorithms', 'agile', 'scrum', 'system design',
  'microservices', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'webpack', 'babel', 'jest', 'mocha',
  'cypress', 'selenium', 'jenkins', 'github actions', 'terraform', 'ansible', 'prometheus', 'grafana', 'elk stack'
];

function extractKeywords(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  return TECH_DICTIONARY.filter(tech => {
    if (tech.includes('+') || tech.includes('#') || tech.includes('.')) {
      return lowerText.includes(tech);
    }
    const escapedTech = tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escapedTech}\\b`, 'i').test(lowerText);
  });
}

function calculateWeightedAtsScore(parsedResume, jobDescription) {
  const jdKeywords = extractKeywords(jobDescription);
  if (jdKeywords.length === 0) {
    return {
      score: 0,
      breakdown: { skills: 0, experience: 0, projects: 0, certifications: 0, achievements: 0, education: 0 },
      matchedKeywords: [],
      missingKeywords: []
    };
  }

  let skillsScore = 0;
  let experienceScore = 0;
  let projectsScore = 0;
  let certificationsScore = 0;
  let achievementsScore = 0;

  const resumeSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
  const projectsText = (parsedResume.projects || []).map(p => `${p.title} ${p.description}`).join(' ').toLowerCase();
  const experienceText = (parsedResume.experience || []).map(e => `${e.role} ${e.description}`).join(' ').toLowerCase();
  const educationText = (parsedResume.education || []).map(edu => `${edu.degree} ${edu.school}`).join(' ').toLowerCase();

  const additionalInfo = parsedResume.additionalInfo || {};
  const certificationsText = (additionalInfo.certifications || []).join(' ').toLowerCase();
  const achievementsText = (additionalInfo.achievements || []).join(' ').toLowerCase();

  const matchedKeywords = [];
  const missingKeywords = [];

  jdKeywords.forEach(keyword => {
    let matchesThisKeyword = false;

    if (resumeSkills.includes(keyword)) {
      skillsScore++;
      matchesThisKeyword = true;
    }
    if (experienceText.includes(keyword)) {
      experienceScore++;
      matchesThisKeyword = true;
    }
    if (projectsText.includes(keyword)) {
      projectsScore++;
      matchesThisKeyword = true;
    }
    if (certificationsText.includes(keyword)) {
      certificationsScore++;
      matchesThisKeyword = true;
    }
    if (achievementsText.includes(keyword)) {
      achievementsScore++;
      matchesThisKeyword = true;
    }

    if (matchesThisKeyword) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const skillsPercent = jdKeywords.length ? (skillsScore / jdKeywords.length) : 0;
  const experiencePercent = jdKeywords.length ? (experienceScore / jdKeywords.length) : 0;
  const projectsPercent = jdKeywords.length ? (projectsScore / jdKeywords.length) : 0;
  const certificationsPercent = jdKeywords.length ? (certificationsScore / jdKeywords.length) : 0;
  const achievementsPercent = jdKeywords.length ? (achievementsScore / jdKeywords.length) : 0;

  const hasCSDegree = educationText.includes('computer science') || educationText.includes('b.tech') || educationText.includes('bachelor');
  const educationPercent = hasCSDegree ? 1.0 : 0.5;

  const finalScore = Math.round(
    (skillsPercent * 40) +
    (experiencePercent * 30) +
    (projectsPercent * 15) +
    (certificationsPercent * 8) +
    (achievementsPercent * 4) +
    (educationPercent * 3)
  );

  return {
    score: Math.min(100, finalScore),
    breakdown: {
      skills: Math.round(skillsPercent * 100),
      experience: Math.round(experiencePercent * 100),
      projects: Math.round(projectsPercent * 100),
      certifications: Math.round(certificationsPercent * 100),
      achievements: Math.round(achievementsPercent * 100),
      education: Math.round(educationPercent * 100)
    },
    matchedKeywords,
    missingKeywords
  };
}

// @route   POST api/resume/calculate-ats
// @desc    Calculate local ATS matching score with weighted segments
// @access  Private
exports.calculateAts = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ msg: 'Job description text is required for matching.' });
    }

    const resume = await Resume.findOne({ userId: req.user.id });
    if (!resume) {
      return res.status(404).json({ msg: 'No resume profile found. Please upload a resume first.' });
    }

    const result = calculateWeightedAtsScore(resume, jobDescription);
    res.json(result);
  } catch (error) {
    console.error('ATS score calculation error:', error.message);
    res.status(500).json({ msg: 'Error performing ATS analysis.' });
  }
};
