const Report = require('../models/Report');
const Interview = require('../models/Interview');
const Submission = require('../models/Submission');
const Roadmap = require('../models/Roadmap');
const modelapi = require('../services/modelapi');

// @route   POST api/report/generate/:interviewId
// @desc    Finish interview, evaluate solutions, and create performance report + 30-day learning roadmap
// @access  Private
exports.generateReport = async (req, res) => {
  const { interviewId } = req.params;

  try {
    // Find interview session
    const interview = await Interview.findOne({ _id: interviewId, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ msg: 'Interview session not found' });
    }

    // Update interview status to completed
    interview.status = 'completed';
    await interview.save();

    // Fetch user submissions for this interview
    const submissions = await Submission.find({ interviewId });

    console.log(`Evaluating interview ${interviewId} with ${submissions.length} submissions...`);

    // Grade and generate feedback
    const evaluation = await modelapi.evaluateInterview(interview, submissions);

    // Save/Update report
    let report = await Report.findOne({ interviewId });

    if (report) {
      report.overallScore = evaluation.overallScore || 0;
      report.technicalScore = evaluation.technicalScore || 0;
      report.communicationScore = evaluation.communicationScore || 0;
      report.scoresBreakdown = evaluation.scoresBreakdown || {};
      report.strengths = evaluation.strengths || [];
      report.weakAreas = evaluation.weakAreas || [];
      report.aiFeedback = evaluation.aiFeedback || {};
    } else {
      report = new Report({
        userId: req.user.id,
        interviewId,
        overallScore: evaluation.overallScore || 0,
        technicalScore: evaluation.technicalScore || 0,
        communicationScore: evaluation.communicationScore || 0,
        scoresBreakdown: evaluation.scoresBreakdown || {},
        strengths: evaluation.strengths || [],
        weakAreas: evaluation.weakAreas || [],
        aiFeedback: evaluation.aiFeedback || {}
      });
    }

    await report.save();

    // Generate study roadmap based on weak areas
    console.log(`Generating study roadmap for weak areas: ${JSON.stringify(report.weakAreas)}...`);
    const roadmapDetails = await modelapi.generateRoadmap(report.weakAreas);

    // Update or create Roadmap in database
    let roadmap = await Roadmap.findOne({ userId: req.user.id });

    if (roadmap) {
      roadmap.weakTopics = roadmapDetails.weakTopics || [];
      roadmap.weeks = roadmapDetails.weeks || [];
    } else {
      roadmap = new Roadmap({
        userId: req.user.id,
        weakTopics: roadmapDetails.weakTopics || [],
        weeks: roadmapDetails.weeks || []
      });
    }

    await roadmap.save();

    res.json({ report, roadmap });
  } catch (error) {
    console.error('Generate report error:', error.message);
    res.status(500).json({ msg: 'Failed to evaluate interview solutions and generate report.' });
  }
};

// @route   GET api/report/history
// @desc    Get all reports history for user
// @access  Private
exports.getReportsHistory = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id })
      .populate({
        path: 'interviewId',
        select: 'role difficulty questionCount createdAt'
      })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Reports history fetch error:', error.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/report/interview/:interviewId
// @desc    Get detailed report for a specific interview
// @access  Private
exports.getReportByInterviewId = async (req, res) => {
  try {
    const report = await Report.findOne({ interviewId: req.params.interviewId, userId: req.user.id });
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Report fetch error:', error.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/report/roadmap
// @desc    Get the user's latest learning roadmap
// @access  Private
exports.getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.id });
    if (!roadmap) {
      return res.status(404).json({ msg: 'No roadmap found. Complete an interview first to generate a roadmap.' });
    }
    res.json(roadmap);
  } catch (error) {
    console.error('Roadmap fetch error:', error.message);
    res.status(500).send('Server error');
  }
};

// Helper to calculate local SDE keyword match for baseline resume score
const TECH_DICTIONARY = [
  'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'golang', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'c',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', 'laravel', 'nest.js',
  'mongodb', 'postgresql', 'mysql', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'graphql', 'rest api', 'ci/cd', 'firebase', 'nginx',
  'machine learning', 'deep learning', 'data structures', 'algorithms', 'agile', 'scrum', 'system design',
  'microservices', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'webpack', 'babel', 'jest', 'mocha',
  'cypress', 'selenium', 'jenkins', 'github actions', 'terraform', 'ansible', 'prometheus', 'grafana', 'elk stack'
];

const Resume = require('../models/Resume');
const axios = require('axios');

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
  if (jdKeywords.length === 0) return { score: 0 };

  let skillsScore = 0;
  let experienceScore = 0;
  let projectsScore = 0;
  let certificationsScore = 0;
  let achievementsScore = 0;

  const resumeSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
  const projectsText = (parsedResume.projects || []).map(p => `${p.title} ${p.description}`).join(' ').toLowerCase();
  const experienceText = (parsedResume.experience || []).map(e => `${e.role} ${e.description}`).join(' ').toLowerCase();

  const additionalInfo = parsedResume.additionalInfo || {};
  const certificationsText = (additionalInfo.certifications || []).join(' ').toLowerCase();
  const achievementsText = (additionalInfo.achievements || []).join(' ').toLowerCase();

  jdKeywords.forEach(keyword => {
    if (resumeSkills.includes(keyword)) skillsScore++;
    if (experienceText.includes(keyword)) experienceScore++;
    if (projectsText.includes(keyword)) projectsScore++;
    if (certificationsText.includes(keyword)) certificationsScore++;
    if (achievementsText.includes(keyword)) achievementsScore++;
  });

  const totalMatches = jdKeywords.length;
  const skillsPercent = totalMatches > 0 ? skillsScore / totalMatches : 0;
  const experiencePercent = totalMatches > 0 ? experienceScore / totalMatches : 0;
  const projectsPercent = totalMatches > 0 ? projectsScore / totalMatches : 0;
  const certificationsPercent = totalMatches > 0 ? certificationsScore / totalMatches : 0;
  const achievementsPercent = totalMatches > 0 ? achievementsScore / totalMatches : 0;

  let educationPercent = 0;
  if (parsedResume.education && parsedResume.education.length > 0) {
    educationPercent = 0.8;
  }

  const weightedScore = (
    skillsPercent * 0.40 +
    experiencePercent * 0.30 +
    projectsPercent * 0.15 +
    certificationsPercent * 0.08 +
    achievementsPercent * 0.04 +
    educationPercent * 0.03
  );

  return {
    score: Math.min(100, Math.round(weightedScore * 100 * 2))
  };
}

// @route   GET api/report/placement-prediction
// @desc    Calculate candidate aggregated parameters and fetch Random Forest Placement Predictor
// @access  Private
exports.getPlacementPrediction = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id });
    const hasUploadedResume = !!resume;

    const DEFAULT_SDE_JD = "React Node.js Express Javascript Python Data Structures Algorithms SQL Git software engineer development core CS system design";
    let resumeScore = 0;
    if (hasUploadedResume) {
      const ats = calculateWeightedAtsScore(resume, DEFAULT_SDE_JD);
      resumeScore = ats.score || 0;
    }

    const reports = await Report.find({ userId: req.user.id });
    const practiceVolume = reports.length;

    const completedCodingMock = reports.some(r => r.technicalScore > 0);
    const completedSpeechMock = reports.some(r => r.communicationScore > 0);

    if (!hasUploadedResume || !completedCodingMock || !completedSpeechMock) {
      return res.json({
        unlocked: false,
        checklist: {
          resume: hasUploadedResume,
          coding: completedCodingMock,
          speech: completedSpeechMock
        }
      });
    }

    let sumDsa = 0;
    let sumComm = 0;
    let sumSubject = 0;

    reports.forEach(r => {
      sumDsa += r.scoresBreakdown?.dsa || r.technicalScore || 0;
      sumComm += r.communicationScore || 0;
      
      const os = r.scoresBreakdown?.os || r.technicalScore || 0;
      const dbms = r.scoresBreakdown?.dbms || r.technicalScore || 0;
      const cn = r.scoresBreakdown?.cn || r.technicalScore || 0;
      sumSubject += (os + dbms + cn) / 3;
    });

    const avgDsa = Math.round(sumDsa / reports.length);
    const avgComm = Math.round(sumComm / reports.length);
    const avgSubject = Math.round(sumSubject / reports.length);

    const baseUrl = (process.env.SPEECH_CLASSIFIER_URL || 'https://yp-0502-mock-interview-speech-analysis.hf.space/predict')
      .replace('/predict', '');
    const predictorUrl = `${baseUrl}/predict-placement`;

    console.log(`Querying placement predictor: ${predictorUrl} with stats:`, {
      resume_score: resumeScore,
      dsa_score: avgDsa,
      communication_score: avgComm,
      subject_score: avgSubject,
      practice_volume: Math.min(20, practiceVolume)
    });

    const response = await axios.post(predictorUrl, {
      resume_score: resumeScore,
      dsa_score: avgDsa,
      communication_score: avgComm,
      subject_score: avgSubject,
      practice_volume: Math.min(20, practiceVolume)
    });

    res.json({
      unlocked: true,
      stats: {
        resumeScore,
        avgDsa,
        avgComm,
        avgSubject,
        practiceVolume
      },
      prediction: response.data
    });
  } catch (error) {
    console.error('Error fetching placement prediction:', error.message);
    res.status(500).json({ msg: 'Failed to calculate placement prediction. Model endpoint offline.' });
  }
};

