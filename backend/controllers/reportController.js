const Report = require('../models/Report');
const Interview = require('../models/Interview');
const Submission = require('../models/Submission');
const Roadmap = require('../models/Roadmap');
const geminiService = require('../services/geminiService');

// @route   POST api/report/generate/:interviewId
// @desc    Finish interview, evaluate solutions with Gemini, and create performance report + 30-day learning roadmap
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

    // Grade and generate feedback with Gemini
    const evaluation = await geminiService.evaluateInterview(interview, submissions);

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
    const roadmapDetails = await geminiService.generateRoadmap(report.weakAreas);

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
