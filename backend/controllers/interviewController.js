const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const Submission = require('../models/Submission');
const geminiService = require('../services/geminiService');
const judgeService = require('../services/judgeService');

// @route   POST api/interview/generate
// @desc    Generate personalized interview questions from resume
// @access  Private
exports.generateInterview = async (req, res) => {
  const { role, difficulty, questionCount } = req.body;

  try {
    // Find candidate's resume
    const resume = await Resume.findOne({ userId: req.user.id });
    
    let resumeDetails = null;
    if (resume) {
      resumeDetails = {
        skills: resume.skills,
        projects: resume.projects,
        experience: resume.experience
      };
    }

    console.log(`Generating ${questionCount} questions for role: ${role}, difficulty: ${difficulty}...`);

    // Call Gemini API to generate questions
    const questions = await geminiService.generateQuestions(
      resumeDetails,
      role,
      difficulty,
      questionCount
    );

    // Save generated interview to database
    const newInterview = new Interview({
      userId: req.user.id,
      role,
      difficulty,
      questionCount,
      questions,
      status: 'pending'
    });

    await newInterview.save();

    res.json(newInterview);
  } catch (error) {
    console.error('Generate interview error:', error.message);
    res.status(500).json({ msg: 'Failed to generate interview questions' });
  }
};

// @route   GET api/interview/:id
// @desc    Get interview session details & questions
// @access  Private
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });

    if (!interview) {
      return res.status(404).json({ msg: 'Interview session not found' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Fetch interview error:', error.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/interview/:id/run
// @desc    Run code against public test cases
// @access  Private
exports.runCode = async (req, res) => {
  const { questionId, code, language } = req.body;

  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ msg: 'Interview session not found' });
    }

    const question = interview.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    // Get public test cases
    const publicTestCase = question.testCases.find(tc => tc.isPublic) || question.testCases[0];
    const stdin = publicTestCase ? publicTestCase.input : '';
    const expectedOutput = publicTestCase ? publicTestCase.output : '';

    console.log(`Running user code against test case. Stdin: ${stdin}`);

    const result = await judgeService.executeCode(code, language, stdin, expectedOutput);
    res.json(result);
  } catch (error) {
    console.error('Run code error:', error.message);
    res.status(500).json({ msg: 'Failed to execute code' });
  }
};

// @route   POST api/interview/:id/submit
// @desc    Submit code & evaluate against all test cases
// @access  Private
exports.submitCode = async (req, res) => {
  const { questionId, code, language } = req.body;

  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ msg: 'Interview session not found' });
    }

    const question = interview.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    console.log(`Submitting code for question ${questionId}. Checking all test cases...`);

    let finalStatus = 'Accepted';
    let detailedOutputs = [];
    let firstFailedOutput = '';
    let compileErrorLog = '';

    // Run code against all test cases
    for (let i = 0; i < question.testCases.length; i++) {
      const tc = question.testCases[i];
      const runResult = await judgeService.executeCode(code, language, tc.input, tc.output);

      if (runResult.status === 'Compilation Error') {
        finalStatus = 'Compilation Error';
        compileErrorLog = runResult.compileOutput;
        break;
      }

      if (runResult.status !== 'Accepted') {
        finalStatus = runResult.status; // e.g. Wrong Answer, Runtime Error
        firstFailedOutput = `Failed on case #${i+1}.\nInput: ${tc.input}\nExpected: ${tc.output}\nGot: ${runResult.runtimeOutput}`;
        break;
      }

      detailedOutputs.push(runResult.runtimeOutput);
    }

    // Save submission
    const newSubmission = new Submission({
      userId: req.user.id,
      interviewId: interview.id,
      questionId,
      code,
      language,
      result: finalStatus,
      compileOutput: compileErrorLog,
      runtimeOutput: firstFailedOutput || detailedOutputs.join('\n')
    });

    await newSubmission.save();

    let complexityAnalysis = { optimal: true, potentialTLE: false, sampleTLEInput: '', recommendation: '' };
    if (finalStatus === 'Accepted') {
      try {
        complexityAnalysis = await geminiService.checkCodeComplexity(question, code, language);
      } catch (err) {
        console.warn('Complexity analysis failed:', err.message);
      }
    }

    const savedDoc = newSubmission.toObject ? newSubmission.toObject() : newSubmission;
    savedDoc.complexityAnalysis = complexityAnalysis;

    res.json(savedDoc);
  } catch (error) {
    console.error('Submit code error:', error.message);
    res.status(500).json({ msg: 'Failed to submit code' });
  }
};

// @route   POST api/interview/:id/ai-assist
// @desc    Get coding assistant feedback (hints or questions)
// @access  Private
exports.getAiAssist = async (req, res) => {
  const { questionId, code, language, chatHistory } = req.body;

  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ msg: 'Interview session not found' });
    }

    const question = interview.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    const response = await geminiService.getAssistantResponse(question, code, language, chatHistory);
    res.json(response);
  } catch (error) {
    console.error('AI assistant error:', error.message);
    res.status(500).json({ msg: 'Failed to communicate with AI assistant' });
  }
};
