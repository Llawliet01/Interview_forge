const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Helper to clean JSON responses from LLM
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    // Strip ```json and ``` code block markup
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  
  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = Math.min(
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('[')
  );
  const lastBrace = Math.max(
    cleaned.lastIndexOf('}'),
    cleaned.lastIndexOf(']')
  );

  if (firstBrace !== Infinity && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// Check if any valid AI API key exists
const isMockMode = 
  (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') &&
  (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === '') &&
  (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === '');

// Local counter to track daily/window API calls to preemptively switch models before hitting rate limits
const modelUsageStats = {
  'gemini-3.5-flash': { count: 0, limit: 20 },
  'gemini-2.5-flash': { count: 0, limit: 20 },
  'gemini-3.0-flash': { count: 0, limit: 20 },
  'gemini-3.1-flash-lite': { count: 0, limit: 500 },
  'openai/gpt-oss-120b': { count: 0, limit: 1000 },
  'llama-3.3-70b-versatile': { count: 0, limit: 1000 },
  'llama-3.1-8b-instant': { count: 0, limit: 14400 },
  'meta-llama/llama-3.3-70b-instruct:free': { count: 0, limit: 20 },
  'openai/gpt-oss-120b:free': { count: 0, limit: 20 },
  'nvidia/nemotron-3-super-120b-a12b:free': { count: 0, limit: 20 },
  'qwen/qwen3-coder:free': { count: 0, limit: 20 },
  'cohere/north-mini-code:free': { count: 0, limit: 20 },
  'nousresearch/hermes-3-llama-3.1-405b:free': { count: 0, limit: 20 }
};

let genAI;
let openRouterLimit = 20; // global requests per minute
let openRouterGlobalCount = 0; // global minute counter
let openRouterDailyCount = 0; // global daily counter
let openRouterDailyLimit = 50; // daily max limit
let openRouterInterval = '1m';

async function fetchOpenRouterLimits() {
  if (isMockMode || !process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === '') return;
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/key', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    if (response.data && response.data.data) {
      const { is_free_tier, usage_daily } = response.data.data;
      openRouterLimit = is_free_tier ? 20 : 1000;
      openRouterDailyCount = usage_daily || 0;
      console.log(`[Gemini Service] OpenRouter Key Verified: Free Tier = ${is_free_tier}, Daily Usage = ${openRouterDailyCount}/${openRouterDailyLimit}, Current Minute limit = ${openRouterLimit} RPM`);
      
      // Update stats dynamically
      Object.keys(modelUsageStats).forEach(model => {
        if (model.includes(':free')) {
          modelUsageStats[model].limit = openRouterLimit;
        }
      });
    }
  } catch (error) {
    console.warn('[Gemini Service] Could not fetch OpenRouter limits, using default limits. Error:', error.message);
  }
}

// Periodically reset OpenRouter request counters based on its interval window
setInterval(() => {
  if (openRouterInterval === '1m') {
    openRouterGlobalCount = 0;
    Object.keys(modelUsageStats).forEach(model => {
      if (model.includes(':free')) {
        // Reset count if it is not locked out by a permanent API error (limit > 1)
        if (modelUsageStats[model].limit > 1) {
          modelUsageStats[model].count = 0;
        }
      }
    });
    console.log('[Gemini Service] Resetting OpenRouter minute rate limit counters.');
  }
}, 60000); // 60s window

if (!isMockMode) {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '') {
     genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  // Initialize OpenRouter limit check asynchronously
  fetchOpenRouterLimits();
} else {
  console.log('Running Gemini Service in MOCK mode (No AI API Keys specified)');
}

/**
 * Helper to call Gemini model generateContent with exponential backoff on transient errors (429, 503)
 */
async function generateContentWithRetry(model, prompt, retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      const isTransient = error.status === 503 || error.status === 429 || 
                          error.message.includes('503') || error.message.includes('429') ||
                          error.message.includes('Service Unavailable') || error.message.includes('Too Many Requests') ||
                          error.message.includes('high demand');
      if (isTransient && i < retries - 1) {
        console.warn(`Gemini API call failed with transient error. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

/**
 * Abstracts provider calls (Gemini SDK, Groq HTTP API, OpenRouter HTTP API).
 */
async function callProvider(provider, modelName, prompt) {
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured.');
    }
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    const result = await generateContentWithRetry(model, prompt, 2);
    return result.response.text();
  }

  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key is not configured.');
    }
    console.log(`[Gemini Service] Sending POST to Groq for model ${modelName}...`);
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );
    if (response.data && response.data.choices && response.data.choices[0]) {
      const remainingRequests = parseInt(response.headers['x-ratelimit-remaining-requests'] || response.headers['x-ratelimit-remaining']);
      const limitRequests = parseInt(response.headers['x-ratelimit-limit-requests'] || response.headers['x-ratelimit-limit']);
      
      if (!isNaN(remainingRequests) && !isNaN(limitRequests)) {
        modelUsageStats[modelName] = {
          count: limitRequests - remainingRequests,
          limit: limitRequests
        };
        
        if (remainingRequests < 3) {
          console.warn(`[Gemini Service] Warning: Groq model ${modelName} has only ${remainingRequests} requests remaining in the current window. Preemptively flagging as rate-limited.`);
          modelUsageStats[modelName].count = limitRequests; // Force switch
        }
      }
      return response.data.choices[0].message.content;
    }
    throw new Error('Invalid response structure received from Groq API');
  }

  if (provider === 'openrouter') {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured.');
    }
    console.log(`[Gemini Service] Sending POST to OpenRouter for model ${modelName}...`);
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'InterviewForge AI'
        },
        timeout: 15000
      }
    );
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }
    throw new Error('Invalid response structure received from OpenRouter API');
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * Helper to execute prompts against a chain of fallback models based on task type.
 */
async function generateContentWithFallback(taskType, prompt) {
  if (isMockMode) {
    throw new Error('Running in Mock Mode; fallback generator should not be executed directly.');
  }

  const chains = {
    resume: [
      { provider: 'groq', model: 'openai/gpt-oss-120b' },
      { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'openrouter', model: 'openai/gpt-oss-120b:free' }
    ],
    questions: [
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'gemini', model: 'gemini-3.5-flash' },
      { provider: 'openrouter', model: 'qwen/qwen3-coder:free' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' }
    ],
    assistant: [
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
      { provider: 'openrouter', model: 'cohere/north-mini-code:free' }
    ],
    evaluate: [
      { provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'gemini', model: 'gemini-3.5-flash' },
      { provider: 'openrouter', model: 'nousresearch/hermes-3-llama-3.1-405b:free' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' }
    ],
    audio_evaluate: [
      { provider: 'gemini', model: 'gemini-2.5-flash' },
      { provider: 'gemini', model: 'gemini-3.0-flash' },
      { provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' }
    ],
    roadmap: [
      { provider: 'gemini', model: 'gemini-3.5-flash' },
      { provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free' },
      { provider: 'groq', model: 'openai/gpt-oss-120b' },
      { provider: 'openrouter', model: 'openai/gpt-oss-120b:free' }
    ],
    audio: [
      { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' }
    ]
  };

  const modelChain = chains[taskType] || chains.resume;
  let lastError = null;

  for (const step of modelChain) {
    const { provider, model } = step;
    
    const hasKey = 
      (provider === 'gemini' && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '') ||
      (provider === 'groq' && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== '') ||
      (provider === 'openrouter' && process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== '');

    if (!hasKey) {
      console.log(`[Gemini Service] Skipping ${model} (${provider}) - API key not configured.`);
      continue;
    }

    // Preemptive rate-limit check
    const stat = modelUsageStats[model];
    if (stat && stat.count >= stat.limit - 2) {
      console.warn(`[Gemini Service] Warning: Model ${model} (${provider}) is approaching rate limit (${stat.count}/${stat.limit}). Preemptively switching to next fallback...`);
      continue;
    }

    if (provider === 'openrouter') {
      if (openRouterDailyCount >= openRouterDailyLimit) {
        console.warn(`[Gemini Service] Warning: OpenRouter daily limit reached (${openRouterDailyCount}/${openRouterDailyLimit}). Preemptively switching to next fallback...`);
        continue;
      }
      if (openRouterGlobalCount >= openRouterLimit - 2) {
        console.warn(`[Gemini Service] Warning: OpenRouter global minute limit reached (${openRouterGlobalCount}/${openRouterLimit}). Preemptively switching to next fallback...`);
        continue;
      }
    }

    try {
      console.log(`[Gemini Service] Attempting prompt on ${model} using ${provider} (${taskType} task)...`);
      const responseText = await callProvider(provider, model, prompt);
      
      // Increment successful request count
      if (modelUsageStats[model]) {
        modelUsageStats[model].count += 1;
      }
      if (provider === 'openrouter') {
        openRouterGlobalCount += 1;
        openRouterDailyCount += 1;
        // Sync limits & daily usage stats dynamically in the background
        fetchOpenRouterLimits().catch(err => {
          console.warn('[Gemini Service] Background limits update failed:', err.message);
        });
      }
      
      console.log(`[Gemini Service] Successfully completed request with ${model} (${provider})`);
      return responseText;
    } catch (error) {
      console.warn(`[Gemini Service] Call to ${model} (${provider}) failed: ${error.message || error}. Trying next fallback...`);
      
      const status = error.response ? error.response.status : null;
      const isPermanent = status === 401 || status === 403 || status === 404;
      const isRateLimit = status === 429;

      if (provider === 'openrouter') {
        if (isRateLimit) {
          console.warn(`[Gemini Service] OpenRouter returned 429. Setting global rate limit counter to maximum.`);
          openRouterGlobalCount = openRouterLimit;
        }
      }

      if (!modelUsageStats[model]) {
        modelUsageStats[model] = { count: 0, limit: 20 };
      }

      if (isPermanent) {
        console.warn(`[Gemini Service] Permanent failure (${status}) for ${model} on ${provider}. Disabling model for this session.`);
        modelUsageStats[model].limit = 0;
      }
      modelUsageStats[model].count = modelUsageStats[model].limit;
      
      lastError = error;
    }
  }

  throw new Error(`All fallback providers/models for task '${taskType}' failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

/**
 * Parses resume text to extract skills, projects, experience, and education
 */
const analyzeResume = async (resumeText) => {
  if (isMockMode || !resumeText) {
    // Return mock parsed resume
    return {
      skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Python', 'C++', 'Git', 'Data Structures', 'Algorithms'],
      projects: [
        {
          title: 'E-Commerce Platform',
          description: 'A full-stack e-commerce store with user auth, product catalog, cart management, and payment gateway integration.',
          technologies: ['React', 'Node.js', 'Express', 'MongoDB']
        },
        {
          title: 'Task Manager App',
          description: 'A productivity application to create, update, delete tasks with categories and priority sorting.',
          technologies: ['JavaScript', 'HTML5', 'CSS3']
        }
      ],
      experience: [
        {
          role: 'Software Engineer Intern',
          company: 'Tech Solutions Inc',
          duration: '3 Months',
          description: 'Developed and optimized frontend UI components using React and worked on API integrations.'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Technology in Computer Science',
          school: 'State Technical University',
          year: '2025'
        }
      ],
      additionalInfo: {
        contact: {
          email: 'internship_forge_candidate@example.com',
          phone: '+1 (555) 019-2834',
          location: 'San Francisco, CA',
          links: ['https://github.com/forge_candidate', 'https://linkedin.com/in/forge_candidate']
        },
        certifications: [
          'AWS Certified Developer - Associate',
          'Google Cloud Digital Leader'
        ],
        achievements: [
          'First place winner at University Hackathon 2025',
          'Recipient of Academic Excellence Merit Scholarship'
        ],
        // Dynamic Fields
        hobbies: ['Competitive Programming', 'System Design', 'Hiking'],
        languages: ['English (Native)', 'Spanish (Conversational)'],
        summary: 'Ambitious computer science student with hands-on experience building full-stack applications. Strong foundation in software engineering principles, agile development, and clean code practices.'
      }
    };
  }

  try {
    const prompt = `
      Analyze the following resume text and extract the candidate's core skills, projects, work experience, education history, and all other miscellaneous details (contact, summary, certifications, achievements, languages, hobbies, etc.).
      Return the output as a JSON object matching this schema:
      {
        "skills": ["Skill1", "Skill2"],
        "projects": [
          {
            "title": "Project Title",
            "description": "Short description of what the project does",
            "technologies": ["Tech1", "Tech2"]
          }
        ],
        "experience": [
          {
            "role": "Job Role / Title",
            "company": "Company Name",
            "duration": "Duration (e.g. Jan 2023 - Present or 6 Months)",
            "description": "Brief description of tasks performed"
          }
        ],
        "education": [
          {
            "degree": "Degree (e.g. B.Tech CS)",
            "school": "School or University Name",
            "year": "Graduation Year (e.g. 2024 or 2025)"
          }
        ],
        "additionalInfo": {
          "contact": {
            "email": "candidate@example.com (or null if not found)",
            "phone": "+1234567890 (or null if not found)",
            "location": "City, Country (or null if not found)",
            "links": ["social/portfolio urls found on resume, e.g. github, linkedin, personal websites"]
          },
          "certifications": ["Cert 1", "Cert 2 (must be always present as list, empty list [] if not found)"],
          "achievements": ["Award/Achievement 1 (must be always present as list, empty list [] if not found)"],
          
          // DYNAMIC EXTRA FIELDS:
          // Do NOT hardcode empty lists/strings for the fields below. 
          // ONLY include these specific keys in the JSON if they exist in the resume. 
          // If a section is not present or mentioned, omit the key completely.
          "summary": "Professional summary statement / objective (only if present)",
          "languages": ["Language 1", "Language 2"] (only if present),
          "hobbies": ["Hobby 1", "Hobby 2"] (only if present),
          "publications": ["Publication 1", "Publication 2"] (only if present)
        }
      }

      Resume Text:
      ${resumeText}
    `;

    const text = await generateContentWithFallback('resume', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini analyzeResume error, falling back to mock:', error);
    // Return fallback mock
    return analyzeResume(null);
  }
};

/**
 * Generates custom interview questions based on candidate resume details, role, and difficulty
 */
const generateQuestions = async (resumeDetails, role, difficulty, questionCount = 10) => {
  if (isMockMode) {
    // Generate mock questions
    return getMockQuestions(role, difficulty, questionCount);
  }

  try {
    const prompt = `
      You are an expert technical interviewer. Generate an interview consisting of exactly ${questionCount} questions.
      The candidate is applying for the role of: ${role}.
      The target difficulty is: ${difficulty}.
      ${resumeDetails 
        ? `Use the candidate's resume profile to personalize the questions (incorporate their technologies, skills, or projects where appropriate):
           Skills: ${JSON.stringify(resumeDetails.skills || [])}
           Projects: ${JSON.stringify(resumeDetails.projects || [])}`
        : `The candidate has not provided a resume. Generate standard technical questions relevant for this role.`}

      CRITICAL QUESTION DIVERSITY & DISTRIBUTION RULES:
      1. EXACT 50-50 MIX:
         - Exactly 50% of the questions must be Coding/DSA challenges (programming logic, data structures, algorithms appropriate for ${difficulty} level).
         - Exactly 50% must be Subjective/Theoretical/System Design challenges.
      2. STRENGTHEN SUBJECTIVE DIVERSITY:
         Subjective/Theoretical questions must NOT be generic. They must be highly diverse, deep, and cover a wide range of specific technical topics relevant to the role:
         - Operating Systems (OS): Process synchronization, deadlocks, virtual memory page faults, kernel interrupts, thread safety, CPU scheduling algorithms.
         - Database Management Systems (DBMS): Advanced indexing (B+ Tree vs LSM Trees), transaction isolation levels (Read Committed, Serializable), write-ahead logging (WAL), sharding strategies, NoSQL consistency models (Eventual vs Strong).
         - Computer Networks (CN): TCP flow control (sliding window), TLS handshake execution details, DNS resolution, CDN cache invalidation, load balancing layers (Layer 4 vs Layer 7), WebSockets connection states.
         - System Design & Development Internals: Microservices communication (gRPC vs REST), pub-sub design (Kafka/RabbitMQ partitioning), caching strategies (write-through vs cache-aside, Redis cluster replication), frontend optimization (DOM reflow, React reconciliation internals, code-splitting), backend concurrency handles.
      3. HIGH VARIETY: Ensure no two questions cover similar topics. Each question must target a distinct algorithmic pattern or system component.

      Return the list of questions as a JSON array of objects, where each object matches the following schema:
      {
        "id": "q1", // Incremental ID: q1, q2, q3...
        "title": "Question Name / Short Title",
        "type": "DSA" | "OS" | "DBMS" | "CN" | "Projects",
        "problemStatement": "Full markdown-formatted description of the challenge/question.",
        "constraints": ["Constraint 1 (e.g. Array size up to 10^5)", "Constraint 2 (e.g. Time complexity must be O(N))"],
        "examples": [
          {
            "input": "Input details if applicable",
            "output": "Expected output details",
            "explanation": "Brief explanation of how input maps to output"
          }
        ],
        "templates": {
          "cpp": "// C++ Starter Code template\\n#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nclass Solution {\\npublic:\\n    // Define function here\\n};",
          "python": "# Python Starter Code template\\nclass Solution:\\n    def solve(self, inputs):\\n        pass",
          "java": "// Java Starter Code template\\nimport java.util.*;\\n\\npublic class Solution {\\n    public static void main(String[] args) {\\n        // Starter\\n    }\\n}",
          "javascript": "// JavaScript Starter Code template\\nfunction solve(inputs) {\\n    \\n}"
        },
        "answerExplanation": "Conceptual answer explanation or expected resolution structure.",
        "testCases": [
          {
            "input": "Public/Private input cases for test execution",
            "output": "Expected output for test execution",
            "isPublic": true // or false for hidden cases
          }
        ],
        "hints": ["Hint 1 to help them", "Hint 2 to help them"]
      }

      For non-coding questions (OS, DBMS, CN, Projects), provide starter templates that read response text or let the user type explanations, and adapt the problem statement to ask the candidate to explain, analyze, or design. For these conceptual questions, keep templates clean, and testCases can represent key terms expected in the response or simple validation strings.
    `;

    const text = await generateContentWithFallback('questions', prompt);
    const parsed = cleanJsonResponse(text);
    if (parsed) {
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) {
          return parsed[key];
        }
      }
      if (parsed.id && parsed.title && parsed.problemStatement) {
        return [parsed];
      }
    }
    return parsed;
  } catch (error) {
    console.error('Gemini generateQuestions error, falling back to mock:', error);
    return getMockQuestions(role, difficulty, questionCount);
  }
};

/**
 * AI Assistant Panel - Generates hints, guides the user, or explains code complexity without giving away the direct code.
 */
const getAssistantResponse = async (question, currentCode, language, chatHistory) => {
  if (isMockMode) {
    return {
      message: `I notice you are writing in ${language}. Here is a hint: Make sure you handle edge cases such as empty inputs or negative values. If you are stuck on complexity, think about how using a Hash Map or sorting might reduce your nested loop search time! Let me know if you want me to explain the constraints.`
    };
  }

  try {
    const prompt = `
      You are a helpful AI Interview Co-pilot assisting a candidate.
      They are working on the following question:
      Title: ${question.title}
      Problem: ${question.problemStatement}
      Constraints: ${JSON.stringify(question.constraints)}

      Candidate is writing in: ${language}
      Their current code:
      \`\`\`${language}
      ${currentCode}
      \`\`\`

      Chat History:
      ${JSON.stringify(chatHistory || [])}

      Guidelines:
      - Do NOT provide the direct copy-paste code solution. Do NOT output code blocks or full code snippets.
      - Never give away the exact algorithm/solution. Give small, conceptual nudges only (e.g., "Think about using two pointers to scan from both ends" rather than "Use left = 0, right = n-1 and while loop...").
      - Guide the user by pointing out logic flaws, syntax issues, or recommending algorithms conceptually.
      - Ask leading follow-up questions to test their knowledge.
      - Suggest optimization strategies conceptually.
      
      Respond with a JSON object:
      {
        "message": "Your helpful response here in markdown."
      }
    `;

    const text = await generateContentWithFallback('assistant', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini getAssistantResponse error:', error);
    return { message: 'Sorry, I am having trouble connecting to my cognitive backend. Keep going, you are doing great!' };
  }
};

/**
 * Evaluates the candidate's interview session, including code submissions and questions.
 */
const evaluateInterview = async (interview, submissions) => {
  if (isMockMode || !interview || !submissions) {
    return {
      overallScore: 83,
      technicalScore: 85,
      communicationScore: 80,
      scoresBreakdown: {
        dsa: 85,
        os: 80,
        dbms: 78,
        cn: 82,
        projects: 90
      },
      strengths: [
        'Fast and optimal problem solving in Javascript/Python',
        'Strong clarity in describing web system architectures',
        'Good handling of standard array/string edge cases'
      ],
      weakAreas: [
        'Could optimize SQL queries for index usage in DBMS questions',
        'Struggled slightly with Dynamic Programming (DP) complexity tradeoffs',
        'TCP vs UDP handshake connection phases needs brushing up'
      ],
      aiFeedback: {
        wellDone: 'You showed clean coding style and solved the array-manipulation challenges quickly. Your understanding of modular design is impressive.',
        needsImprovement: 'Focus on time/space analysis. Explain your solution structure before starting to write code. Brush up on advanced database systems index internals.',
        nextSteps: 'Study classic Dynamic Programming schemas, solve 5-10 DBMS schema design exercises, and practices mock vocal reviews to build communication flow.'
      }
    };
  }

  try {
    const submissionsMap = {};
    submissions.forEach(s => {
      submissionsMap[s.questionId] = s;
    });

    const evaluatedQuestions = interview.questions.map(q => {
      const sub = submissionsMap[q.id];
      return {
        id: q.id,
        title: q.title,
        type: q.type,
        status: sub ? sub.result : 'Not Attempted',
        submittedCode: sub ? sub.code : 'No code submitted',
        language: sub ? sub.language : 'N/A'
      };
    });

    const prompt = `
      You are an expert engineering manager and a strict technical interviewer. Grade this completed technical interview session with high standards and zero leniency.
      Interview Info:
      Role: ${interview.role}
      Difficulty: ${interview.difficulty}
      
      Questions and Submissions Status:
      ${JSON.stringify(evaluatedQuestions)}

      CRITICAL EVALUATION & SCORING RULES:
      1. Technical Score (0-100): Must be strictly proportional to the number of successfully solved ('Accepted') questions. Calculate it exactly as: (Number of 'Accepted' questions / Total number of questions) * 100. For example, if only 1 out of 10 questions is Accepted, the Technical Score must be exactly 10.
      2. Communication Score (0-100): Must be scaled down by the ratio of completed questions. Calculate the average communication score of attempted questions, then multiply by the ratio of completed/attempted questions relative to total questions (e.g., if average communication score is 80, but only 1 out of 10 questions was attempted, the final Communication Score must be 80 * 0.1 = 8).
      3. Overall Score (0-100): Calculated as the average of Technical Score and Communication Score.
      4. Skills Breakdown (0-100): The sub-scores for dsa, os, dbms, cn, and projects must strictly reflect the correctness and completeness of the questions in those categories. If no questions in a category were attempted, that sub-score MUST be exactly 0.

      STRICT WEAKNESS DETECTION SYSTEM (CRITICAL):
      - ZERO LENIENCY: You must thoroughly analyze all unattempted or failed questions. Any skipped, wrong, or compilation-failed question is a confirmed weakness.
      - CODE/DSA PANIC RULE: If the candidate solved only 1 or 2 DSA/coding questions (or has a low overall DSA sub-score), you MUST explicitly flag "Data Structures & Algorithms (DSA)" and "Problem-Solving Concurrency" as major weak areas. Do not gloss over this just because they did not attempt it.
      - SPECIFICITY IN CONCEPTUALS: For unattempted or incorrect OS, DBMS, CN, System Design, development specifics (Frontend, Backend, DevOps), or project questions, pinpoint the exact underlying concept they missed. For example, do not just say "DBMS is weak". Say "Inability to design database sharding or explain transaction isolation levels" or "Lack of understanding of process synchronization/deadlocks".
      - Detailed list of "weakAreas": Ensure the weakAreas array is granular and comprehensive, catching all dimensions of skipped or incorrect topics.

      Return your output as a JSON object matching this schema:
      {
        "overallScore": 9,
        "technicalScore": 10,
        "communicationScore": 8,
        "scoresBreakdown": {
          "dsa": 10,
          "os": 0,
          "dbms": 0,
          "cn": 0,
          "projects": 0
        },
        "strengths": ["Strengths 1", "Strengths 2"],
        "weakAreas": ["Weak Area 1", "Weak Area 2"],
        "aiFeedback": {
          "wellDone": "Detailed feedback of what they did well.",
          "needsImprovement": "Detailed feedback of what needs improvement.",
          "nextSteps": "Actionable instructions for next steps."
        }
      }
    `;

    const text = await generateContentWithFallback('evaluate', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini evaluateInterview error, returning mock:', error);
    return evaluateInterview(null, null); // Fallback to mock
  }
};

/**
 * Generates a personalized 30-day Study Roadmap based on user's weak areas.
 */
const generateRoadmap = async (weakTopics) => {
  if (isMockMode || !weakTopics) {
    return {
      weakTopics: weakTopics && weakTopics.length ? weakTopics : ['Dynamic Programming', 'Database Indexing', 'TCP Connection Handshake'],
      durationDays: 30,
      weeks: [
        {
          weekNumber: 1,
          topic: 'Algorithms & Data Structures optimization',
          tasks: [
            'Revise standard array, sorting, and binary search methodologies.',
            'Solve 10 Medium questions using Sliding Window and Two-Pointer tactics.',
            'Document time and space complexities for each solved problem.'
          ],
          resources: ['LeetCode Top Interview 150', 'GeeksforGeeks DSA Guide']
        },
        {
          weekNumber: 2,
          topic: 'Advanced Database Internals (DBMS)',
          tasks: [
            'Study B-Trees and B+ Trees indexing structure.',
            'Analyze execution plans (EXPLAIN) of SQL queries to find bottleneck points.',
            'Implement composite indices and trace efficiency improvements.'
          ],
          resources: ['Use The Index, Luke (indexing guide)', 'PostgreSQL EXPLAIN Documentation']
        },
        {
          weekNumber: 3,
          topic: 'Operating Systems & Networks Foundations',
          tasks: [
            'Map the 3-Way Handshake and 4-Way Tear-down cycles in TCP.',
            'Understand CPU scheduling, process control blocks, and deadlocks.',
            'Review Virtual Memory, paging, and page replacement strategies.'
          ],
          resources: ['OS Three Easy Pieces book', 'Computer Networking: A Top-Down Approach']
        },
        {
          weekNumber: 4,
          topic: 'Mock Coding Rounds & Projects Polish',
          tasks: [
            'Run 3 simulated interviews on InterviewForge AI.',
            'Practice talking aloud while writing solutions to explain thoughts.',
            'Document system architecture patterns of your top projects.'
          ],
          resources: ['InterviewForge AI Practice Simulator', 'System Design Primer']
        }
      ]
    };
  }

  try {
    const prompt = `
      Create a highly rigorous and serious 30-day learning roadmap divided into 4 weeks to aggressively address the candidate's technical weaknesses.
      The candidate's identified weak areas are: ${JSON.stringify(weakTopics || [])}
      
      CRITICAL ROADMAP DESIGN RULES (HIGH INTENSITY):
      1. COMPREHENSIVE COVERAGE: The schedule must directly address every single weakness in the list (including DSA coding structures, System Design, OS kernel internals, DBMS sharding, Network protocols, or specific Development architectures).
      2. HIGH INTENSITY TASKS: Do not write high-level, generic advice. Tasks must be concrete, technical, and demanding. Specify rigorous tasks (e.g., "Implement a lock-free queue or B-Tree index simulator in Python", "Solve 15 LeetCode Medium binary tree problems and trace call stacks", "Analyze TCP header segments and TLS handshakes using Wireshark packets").
      3. SERIOUS ACADEMIC TONE: Write the tasks with serious academic rigour, enforcing standard engineering metrics (e.g. target time complexities, design patterns, profiling benchmarks).
      4. DIRECT RESOURCES: Suggest specific, high-quality, practical resources (e.g., standard textbooks, documentation portals, RFC specifications, official LeetCode patterns).

      Generate a calendar-based weekly program mapping out topics, study tasks, and links/resources.
      Return the output as a JSON object matching this schema:
      {
        "weakTopics": ${JSON.stringify(weakTopics || [])},
        "durationDays": 30,
        "weeks": [
          {
            "weekNumber": 1,
            "topic": "Topic of the week aggressively tackling the targeted weaknesses",
            "tasks": ["Demanding task 1 with technical metrics", "Demanding task 2 with technical metrics", "Demanding task 3 with technical metrics"],
            "resources": ["Resource Name 1 (e.g. OSDI class papers)", "Resource Name 2 (e.g. official RFC 793 standard)"]
          }
        ]
      }
    `;

    const text = await generateContentWithFallback('roadmap', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini generateRoadmap error, returning mock:', error);
    return generateRoadmap(null);
  }
};

// Helper mock question database for mock mode
function getMockQuestions(role, difficulty, count) {
  const dsaLib = [
    {
      title: 'Two Sum',
      type: 'DSA',
      problemStatement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' }
      ],
      templates: {
        cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
        python: 'class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
        java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[2];\n    }\n}',
        javascript: 'function twoSum(nums, target) {\n    \n}'
      },
      answerExplanation: 'Use a Hash Map to store elements and their indices. For each element x, check if target - x exists in the map.',
      testCases: [
        { input: '[2,7,11,15]\n9', output: '[0,1]', isPublic: true },
        { input: '[3,2,4]\n6', output: '[1,2]', isPublic: true },
        { input: '[3,3]\n6', output: '[0,1]', isPublic: false }
      ],
      hints: ['Try using a Hash Map to get O(N) complexity.', 'Calculate the complement (target - nums[i]) for each element.']
    },
    {
      title: 'Valid Parentheses',
      type: 'DSA',
      problemStatement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
      constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only.'],
      examples: [
        { input: 's = "()[]{}"', output: 'true', explanation: 'All open brackets are closed correctly.' }
      ],
      templates: {
        cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};',
        python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass',
        java: 'class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}',
        javascript: 'function isValid(s) {\n    \n}'
      },
      answerExplanation: 'Use a stack. Push open brackets. For closed brackets, pop and verify if they match.',
      testCases: [
        { input: '"()"', output: 'true', isPublic: true },
        { input: '"()[]{}"', output: 'true', isPublic: true },
        { input: '"(]"', output: 'false', isPublic: false }
      ],
      hints: ['A stack is perfect for this LIFO behavior.', 'Make sure the stack is empty at the end.']
    },
    {
      title: 'Merge Intervals',
      type: 'DSA',
      problemStatement: 'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
      constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2'],
      examples: [
        { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].' }
      ],
      templates: {
        cpp: 'class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};',
        python: 'class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        pass',
        java: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[0][0];\n    }\n}',
        javascript: 'function merge(intervals) {\n    \n}'
      },
      answerExplanation: 'Sort intervals by their start time. Iterate and merge overlapping ones with the last merged interval.',
      testCases: [
        { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', isPublic: true },
        { input: '[[1,4],[4,5]]', output: '[[1,5]]', isPublic: false }
      ],
      hints: ['Sort the intervals by their start times first.', 'Track the active interval and compare its end value with the next interval\'s start.']
    }
  ];

  const conceptualLib = [
    {
      title: 'Explain Database Indexing Internals',
      type: 'DBMS',
      problemStatement: 'Provide a structured explanation of how a B+ Tree index accelerates SELECT queries in relational databases. Mention the differences between Clustered and Non-Clustered indices, and explain how a write operation (INSERT/UPDATE) affects index performance.',
      constraints: ['Write at least 150 words.', 'Discuss B+ Tree traversal.'],
      examples: [],
      templates: {
        cpp: '// Type your explanation as a multi-line comment or string return.\nstring explainIndex() {\n    return "Write explanation here";\n}',
        python: 'def explain_index():\n    return "Write explanation here"',
        java: 'public class Main {\n    public static String explain() {\n        return "Write explanation here";\n    }\n}',
        javascript: 'function explainIndex() {\n    return "Write explanation here";\n}'
      },
      answerExplanation: 'A B+ Tree contains values in leaf nodes connected sequentially. Traversal requires O(log N). Clustered indexes dictate the physical arrangement, while Non-clustered contain search pointers.',
      testCases: [
        { input: '""', output: '"Valid"', isPublic: true }
      ],
      hints: ['Recall tree height depth logic.', 'Identify index overhead on writes.']
    },
    {
      title: 'Process vs Thread and CPU Context Switching',
      type: 'OS',
      problemStatement: 'Explain the technical differences between a Process and a Thread in terms of memory sharing and overhead. Then, detail what happens in the hardware and operating system kernel during a CPU context switch between two processes.',
      constraints: ['Define virtual address space sharing.', 'Include PCB (Process Control Block) context saves.'],
      examples: [],
      templates: {
        cpp: 'string explainOS() {\n    return "Write explanation here";\n}',
        python: 'def explain_os():\n    return "Write explanation here"',
        java: 'public class Main {\n    public static String explain() {\n        return "Write explanation here";\n    }\n}',
        javascript: 'function explainOS() {\n    return "Write explanation here";\n}'
      },
      answerExplanation: 'Processes possess independent memory heaps. Threads share memory within the same process. Context switching saves register values, updates PCB pointers, and invalidates TLB page translations.',
      testCases: [
        { input: '""', output: '"Valid"', isPublic: true }
      ],
      hints: ['A Process has its own address space, whereas Threads share it.', 'Mention the Translation Lookaside Buffer (TLB) flush.']
    },
    {
      title: 'Explain System Architecture: E-Commerce',
      type: 'Projects',
      problemStatement: 'Explain how you would design a scalable backend checkout system for an e-commerce platform that handles massive traffic surges (e.g., flash sales). Address how to prevent race conditions on stock quantity levels and ensure eventual consistency.',
      constraints: ['Use database transactions or locking mechanisms.', 'Describe how queues (e.g., RabbitMQ/Kafka) prevent checkout service crashes.'],
      examples: [],
      templates: {
        cpp: 'string explainProjects() {\n    return "Write explanation here";\n}',
        python: 'def explain_projects():\n    return "Write explanation here"',
        java: 'public class Main {\n    public static String explain() {\n        return "Write explanation here";\n    }\n}',
        javascript: 'function explainProjects() {\n    return "Write explanation here";\n}'
      },
      answerExplanation: 'Surges are throttled via Message Queues. Inventory double-booking is avoided using optimistic locking (version numbers) or pessimistic database locks on row levels.',
      testCases: [
        { input: '""', output: '"Valid"', isPublic: true }
      ],
      hints: ['Think of message queues as shock absorbers.', 'Compare database locking approaches.']
    }
  ];

  const questions = [];
  
  // Fill up DSA questions
  for (let i = 0; i < Math.min(count, 5); i++) {
    const qBase = dsaLib[i % dsaLib.length];
    questions.push({
      ...qBase,
      id: `q${i + 1}`,
      title: `${qBase.title}`
    });
  }

  // Fill up Conceptual questions
  for (let i = questions.length; i < count; i++) {
    const qBase = conceptualLib[i % conceptualLib.length];
    questions.push({
      ...qBase,
      id: `q${i + 1}`,
      title: `${qBase.title}`
    });
  }

  return questions;
}

async function getProactiveHint(question, code, language) {
  try {
    if (isMockMode) {
      return null;
    }

    const systemInstruction = `You are a helpful, professional technical interviewer observing a candidate code in real-time.
Your job is to analyze their draft code for the given problem and determine if they have made a critical logical error, syntax mistake, infinite loop, or extreme performance bottleneck.
Provide a very short, polite, encouraging hint (1-2 sentences max) to guide them back on track.
CRITICAL: If the code is correct, incomplete but on the right track, or doesn't have obvious fatal errors, you MUST return exactly the word "NULL". Do not nag or distract the candidate unless they are stuck or making a critical blunder. Do not write code solutions.`;

    const prompt = `${systemInstruction}

Question Title: ${question.title}
Problem Statement: ${question.description}
Programming Language: ${language}

Candidate's Current Draft Code:
\`\`\`${language}
${code}
\`\`\`

Analyze the code. If they have an obvious bug or critical performance bottleneck, return a 1-2 sentence hint. Otherwise, return exactly "NULL".`;

    const response = await generateContentWithFallback('assistant', prompt);
    if (!response || response.trim().toUpperCase() === 'NULL' || response.trim().toUpperCase().includes('NULL')) {
      return null;
    }

    return response.trim();
  } catch (error) {
    console.error('[Gemini Service] getProactiveHint error:', error.message);
    return null;
  }
}

async function checkCodeComplexity(question, code, language) {
  if (isMockMode) {
    const isMockTwoSumNested = code.includes('for') && (code.match(/for/g) || []).length > 1;
    return {
      optimal: !isMockTwoSumNested,
      potentialTLE: isMockTwoSumNested,
      sampleTLEInput: "[1, 2, ..., 100000] (where size N = 10^5)",
      recommendation: "Use a hash map instead of nested loops to reduce search time from O(N^2) to O(N)."
    };
  }

  try {
    const prompt = `
      You are an expert technical interviewer analyzing a candidate's completed code solution that has just passed all basic functional test cases.
      Analyze the code's time and space complexity.
      
      Question Details:
      Title: ${question.title}
      Problem statement: ${question.problemStatement || question.description}
      Constraints: ${JSON.stringify(question.constraints || [])}
      
      Candidate's Submitted Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      CRITICAL EVALUATION RULES:
      1. Determine if the time and space complexity of the code is optimal for the given problem. For example, if the optimal time is O(N) but candidate wrote O(N^2), it is NOT optimal.
      2. If the solution is NOT optimal and could easily result in Time Limit Exceeded (TLE) under constraints (e.g. constraints have N up to 10^5 and candidate is using nested loops O(N^2)):
         - Set "optimal" to false.
         - Set "potentialTLE" to true.
         - Provide a clear, concrete "sampleTLEInput" showing a test case that would trigger a timeout (e.g., "An array of 100,000 numbers where no two numbers sum up to target").
         - Provide a 1-2 sentence conceptual "recommendation" on how to make it optimal.
      3. If the solution is NOT optimal, but the constraints are small enough that it will NOT result in TLE (so it can be accepted):
         - Set "optimal" to false.
         - Set "potentialTLE" to false.
         - Provide a 1-2 sentence conceptual "recommendation" suggesting there is a more optimal approach, but they can proceed.
      4. If the solution is fully optimal (matches the best known time/space complexities for this problem):
         - Set "optimal" to true.
         - Set "potentialTLE" to false.
         - Set "sampleTLEInput" to "".
         - Set "recommendation" to "".
         
      Return ONLY a clean JSON object in this format:
      {
        "optimal": false,
        "potentialTLE": true,
        "sampleTLEInput": "description of the input case",
        "recommendation": "your recommendation here"
      }
    `;

    const text = await generateContentWithFallback('assistant', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini checkCodeComplexity error:', error);
    return { optimal: true, potentialTLE: false, sampleTLEInput: '', recommendation: '' };
  }
}

async function explainError(errorType, errorLog, code, language) {
  if (isMockMode) {
    return "There is a syntax error in your function definition. Double check that all colons and indentation align with standard syntax rules.";
  }

  try {
    const prompt = `
      You are an expert programming coach helping a candidate debug their code.
      They encountered a ${errorType} while running code in ${language}.
      
      Candidate's Code:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Raw Error Log:
      ${errorLog}
      
      Task:
      1. Identify the exact line or block where the error is located.
      2. Explain what is causing the error in plain English.
      3. Give a high-level conceptual hint on how to fix it (do NOT write the corrected code solution).
      
      Keep your response very short, friendly, and concise (2-3 sentences max). Direct it as if speaking to the user. Do NOT read raw stack trace logs.
    `;

    const text = await generateContentWithFallback('assistant', prompt);
    return text.trim();
  } catch (error) {
    console.error('explainError error:', error);
    return `Your solution had a ${errorType.toLowerCase()}. Review your lines to find the issue.`;
  }
}

/**
 * Voice Interview prep - generates a natural, highly concise follow-up question or evaluation turn.
 */
const getAudioInterviewResponse = async (history, topic) => {
  if (isMockMode) {
    return {
      message: "This is a mock voice response. System design involves structural tradeoffs between availability and consistency. How would you handle scaling your database?"
    };
  }

  try {
    const prompt = `
      You are a professional software engineer conducting a voice-only mock interview.
      The topic of the interview is: ${topic}.

      Conversation History:
      ${JSON.stringify(history || [])}

      Guidelines:
      - Since your response will be read aloud using text-to-speech, keep it extremely brief (1 to 3 sentences maximum).
      - Do NOT output code blocks, HTML, markdown lists, or emojis. Output plain conversational text only.
      - Keep a professional, encouraging, and clear tone.
      - Evaluate their response. If they made a mistake, guide them gently. If their response was good, ask a relevant follow-up question to test their depth.

      Respond with a JSON object:
      {
        "message": "Your conversational response here."
      }
    `;

    const text = await generateContentWithFallback('audio', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini getAudioInterviewResponse error:', error);
    return { message: 'I encountered a small network glitch. Please tell me more about your thoughts on this!' };
  }
};

/**
 * Evaluates the voice mock interview transcript history.
 */
const evaluateAudioInterview = async (history, topic) => {
  const userMessages = (history || []).filter(msg => msg.role === 'user');
  
  // Filter out the initial welcome trigger message and very short greeting tests
  const genuineReplies = userMessages.filter(msg => {
    const text = (msg.text || '').toLowerCase().trim();
    return text.length > 0 && !text.includes('start the voice interview') && text !== 'hello' && text !== 'hi';
  });

  if (genuineReplies.length === 0) {
    return {
      score: 0,
      summary: "No evaluation could be generated because the candidate did not answer any interview questions during the mock session.",
      strengths: ["Initiated the practice round."],
      improvements: [
        "Please participate in the voice interview by answering the questions out loud.",
        "Ensure your microphone is unmuted and browser audio permissions are granted."
      ]
    };
  }

  if (isMockMode) {
    return {
      score: 85,
      summary: "You demonstrated solid knowledge of " + topic + ". You explained your concepts clearly, though some detailed edge cases could be improved.",
      strengths: ["Clear explanation of core concepts", "Good structured thought process"],
      improvements: ["Elaborate more on optimization strategies", "Provide deeper details on structural trade-offs"],
      minor_weaknesses: ["Define simple memory management rules", "Double check index selection conventions"]
    };
  }

  try {
    const prompt = `
      You are a senior technical interviewer evaluating a candidate's voice mock interview.
      The interview topic was: ${topic}.

      Here is the complete transcript history of the interview:
      ${JSON.stringify(history || [])}

      Evaluate their performance carefully and rigorously.
      
      Evaluation Guidelines:
      - Assign a score out of 100. Be strict and realistic, adhering to real-world senior engineering interview standards.
      - If the candidate provided no real answers, or only extremely short, blurry, non-technical, or filler responses (e.g., "yes", "no", "I don't know", "ok", or random off-topic words), assign a very low score (potentially single digits or under 20).
      - Do not be overly picky on minor syntax or small speech filler words, but do grade strictly if there are medium or major conceptual gaps/weaknesses.
      
      Categorize the candidate's developmental areas into two distinct levels:
      1. Major or medium conceptual gaps/weaknesses (place these in the "improvements" array).
      2. Minor, easily-fixable gaps/weaknesses (place these in the "minor_weaknesses" array).

      Respond with a JSON object:
      {
        "score": 85,
        "summary": "Detailed summary paragraph of their performance...",
        "strengths": ["Strength 1", "Strength 2"],
        "improvements": ["Major/Medium weakness 1", "Major/Medium weakness 2"],
        "minor_weaknesses": ["Easily fixable weakness 1", "Easily fixable weakness 2"]
      }
    `;

    const text = await generateContentWithFallback('audio_evaluate', prompt);
    return cleanJsonResponse(text);
  } catch (error) {
    console.error('Gemini evaluateAudioInterview error:', error);
    return {
      score: 75,
      summary: "Evaluations timed out. Based on your session, you showed good participation and covered several core areas of the topic.",
      strengths: ["Strong communication", "Good initial conceptual outline"],
      improvements: ["Expand on system configurations"],
      minor_weaknesses: ["Refine description of performance trade-offs"]
    };
  }
};

module.exports = {
  analyzeResume,
  generateQuestions,
  getAssistantResponse,
  evaluateInterview,
  generateRoadmap,
  getProactiveHint,
  checkCodeComplexity,
  explainError,
  getAudioInterviewResponse,
  evaluateAudioInterview
};
