# Interview Forge 🚀

> **Mock Interview & Live Coding Preparation Platform**

A comprehensive web application designed to help students and professionals prepare for technical and HR interviews through mock interviews, live coding practice, and resume analysis.

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)

## 📋 Overview

**Interview Forge** is a full-stack web application that simulates real interview scenarios using artificial intelligence. Users can practice technical interviews with AI interviewers, get personalized feedback on their answers, improve their coding skills through live editor sessions, and enhance their resumes with AI-powered analysis.

## 💡 Key Features

### 🎤 Audio Mock Interview System
- **Voice-to-Voice Mock Interviews**: Practice interviews entirely through voice with real-time audio input/output.
- **Dynamic Question Generation**: System customizes interview questions based on user-selected domains and experience levels.
- **Real-Time Feedback**: Immediate evaluation of answers with scores for clarity, confidence, and technical accuracy.
- **Multiple Interview Modes**:
  - **Audio Interview Prep**: Voice-based interviews with transcriptions and detailed analysis
  - **Text Interview Prep**: Traditional text-based interviews
- **Speech Transcription**: Whisper-supported silence detection filters ("I don't know" fallback) to keep dialogue flowing.

### 💻 Live Coding Environment
- **Integrated Code Editor**: In-browser code editor for practicing coding challenges
- **AI Code Explanations**: Get detailed explanations of complex code snippets
- **Real-Time Collaboration**: (Future Feature) Code collaboration with other users
- **Multiple Language Support**: Support for various programming languages

### 📝 Resume Analysis
- **Smart Scoring**: Get instant feedback on resume quality and tech stack matches.
- **Content Suggestions**: System recommends improvements for better impact.
- **File Upload Support**: Upload PDFs to synchronize with your practice tracks.

### 🗺️ Study Roadmaps
- **Custom Milestone Planners**: Generates tailored 30-day study calendars targeting candidate weaknesses.
- **Progress Trackers**: Stay organized by marking milestones and tasks as complete.

### 📊 User Dashboard
- **Personalized Insights**: Track your progress across all mock trials.
- **Performance Analytics**: Detailed metrics on strengths and weaknesses.
- **History & Reports**: View past evaluations and session grading sheets.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Language**: JavaScript / React Context
- **Code Workspace**: Monaco Editor integration
- **Styling & Animations**: Tailwind CSS, Vanilla CSS, Framer Motion
- **UI Components**: Lucide React icons

### Backend & Database
- **Framework**: Node.js with Express
- **Database**: MongoDB (Atlas) with Mongoose ODM
- **Verification Engine**: Nodemailer (secured 6-digit SMTP OTP verification)

### Models & Speech APIs
- **Text & Evaluation Engines**: Google Gemini API, Groq Cloud API, OpenRouter API (configured with auto-failover chains, rate-limit usage statistics, and exponential backoff)
- **Speech-to-Text**: OpenAI Whisper API (for high-fidelity transcription)
- **Text-to-Speech**: Browser-native SpeechSynthesis (with speed selector configuration)

### Code Execution
- **Compiler Sandbox**: Piston API (Self Hosted on Oracle Cloud Infrastructure using Docker-based runtimes for Java, C++, Python, and JavaScript)

### Infrastructure & Deployment
- **Frontend Hosting**: Vercel (Next.js serverless architecture)
- **Backend & Sandbox Hosting**: Oracle Cloud Infrastructure (OCI Compute Instance)
- **Version Control**: Git & GitHub

## 📁 Folder Structure

```
interview_forge/
├── frontend/                # Next.js Application
│   ├── app/                  # App Router Pages
│   │   ├── dashboard/        # Authenticated workspace
│   │   │   ├── audio-interview/   # Voice practice pages
│   │   │   ├── contact/           # Support & bug report
│   │   │   ├── faq/               # Accordioned user support
│   │   │   ├── reports/           # Detailed performance metrics
│   │   │   ├── resume/            # Tech stack PDF analyzer
│   │   │   ├── roadmaps/          # Study milestone trackers
│   │   │   ├── room/[id]/         # Monaco coding editor environment
│   │   │   ├── settings/          # Custom theme & voice controls
│   │   │   └── setup/             # Mock interview profile setup
│   │   ├── login/            # Glassmorphic OTP & auth layout
│   │   ├── globals.css       # Core custom design theme
│   │   └── layout.js         # Navigation layout wrapper
│   ├── context/              # State providers
│   │   ├── AuthContext.js    # JWT & verify-otp state machine
│   │   └── ThemeContext.js   # Light/dark mode manager
│   └── package.json          # Frontend dependencies
│
├── backend/                 # Express.js REST API
│   ├── config/               # DB connectivity wrapper
│   ├── controllers/          # Business logic handlers
│   │   ├── audioController.js
│   │   ├── authController.js
│   │   ├── interviewController.js
│   │   ├── reportController.js
│   │   └── resumeController.js
│   ├── middleware/           # JWT auth interceptors
│   ├── models/               # Mongoose schemas
│   │   ├── Interview.js
│   │   ├── Report.js
│   │   ├── Resume.js
│   │   ├── Roadmap.js
│   │   ├── Submission.js
│   │   └── User.js
│   ├── routes/               # API endpoints mappings
│   ├── services/             # Core service integrations
│   │   ├── compilerapi.js    # Wrapped Piston Sandbox runner
│   │   └── modelapi.js       # Auto-failover LLM model api
│   ├── server.js             # Express app entrypoint
│   └── package.json          # Backend dependencies
│
├── .gitignore                # Git ignore constraints (keys & local tests)
└── README.md                 # Project documentation
```

## 🏁 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.0.0
- **MongoDB**: Access to a MongoDB instance (Atlas recommended)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Llawliet01/Interview_forge.git
cd Interview_forge
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**

```bash
cd ../frontend
npm install
```

## ⚙️ Environment Variables

Create a `.env` file in both `backend/` and `frontend/` directories with the following variables:

### Backend Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_me_in_production
MONGODB_URI=your_mongodb_atlas_connection_uri
GEMINI_API_KEY=your_gemini_api_key
PISTON_URL=your_piston_compiler_service_url
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

### Frontend Environment Variables (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 Running Locally

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

### 2. Start the Frontend Server
```bash
cd frontend
npm run dev
```

The application will be available at http://localhost:3000.
