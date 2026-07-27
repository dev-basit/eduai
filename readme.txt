=========================================================
  EduAI — AI-Powered Personalized Learning Assistant
  Built with Google Gemma at the Hackathon
=========================================================

---------------------------------------------------------
  INSPIRATION
---------------------------------------------------------
Millions of students in Pakistan lack access to quality
tutoring and personalized education support. Textbooks
are generic, teachers are overwhelmed, and private
tutoring is expensive.

We wanted to build an AI tutor that gives every student
a personalized study plan, instant doubt resolution, and
smart assignments — all powered locally using Google's
Gemma model, with no API costs.

---------------------------------------------------------
  WHAT IT DOES
---------------------------------------------------------
EduAI is a full-stack AI education platform that helps
students learn smarter:

  * Lesson Planner
    - Takes a student's subject, goal, and daily study
      hours as input
    - Runs a short diagnostic quiz to assess current level
    - Generates a personalized 7-day study plan with
      daily activities, resources (Khan Academy, YouTube),
      and learning objectives
    - Can regenerate and improve the plan based on actual
      assignment performance data

  * Doubt Solver
    - A conversational AI tutor powered by Gemma
    - Students can ask questions in natural language
    - Gives step-by-step explanations, analogies, and
      worked examples
    - Maintains full conversation history per session

  * Assignments
    - AI generates subject-specific assignments (MCQ,
      short answer, long answer) at a chosen difficulty
    - Automatically grades submitted answers with
      detailed per-question feedback
    - Generates counter-questions for correct answers to
      test genuine understanding (not guessing)
    - Assignment results feed back into the Lesson Planner
      to improve future study plans

---------------------------------------------------------
  HOW WE BUILT IT
---------------------------------------------------------

AI Model
  Gemma 4 (gemma4:e2b) running locally via Ollama
  All inference is on-device — no external API calls

AI Techniques
  * Prompt Engineering: carefully crafted structured
    prompts that return clean JSON for each feature
  * Context-aware tutoring: full chat history is passed
    to the model on every doubt-solver request
  * Feedback loops: assignment grading results are fed
    back into lesson plan improvement prompts
  * Adaptive difficulty: diagnostic quiz results
    calibrate the generated study plan

Tech Stack
  Backend  : Python 3.12 + FastAPI
  Database : PostgreSQL + pgvector (via SQLAlchemy/Alembic)
  AI Layer : LangChain + langchain-ollama (Gemma 4 e2b)
  Frontend : Next.js 16 + React 19 + Tailwind CSS 4

Tools & Platforms
  GitHub, Ollama, pgvector, Alembic, Pydantic

---------------------------------------------------------
  ARCHITECTURE
---------------------------------------------------------

  Student (Browser)
       |
       v
  Next.js 16 Frontend (port 3000)
       |
       v
  FastAPI Backend (port 8000)
       |
       +---> Lesson Plan Service  ---> Gemma 4 (Ollama)
       |
       +---> Doubt Solver Service ---> Gemma 4 (Ollama)
       |
       +---> Assignment Service   ---> Gemma 4 (Ollama)
       |
       v
  PostgreSQL Database
  (lesson_plans, conversations, messages, assignments,
   assignment_submissions)

---------------------------------------------------------
  KEY FEATURES
---------------------------------------------------------

  [x] Personalized 7-day study plan generation
  [x] Diagnostic quiz before planning
  [x] Plan improvement based on real assignment scores
  [x] Conversational AI doubt solver with history
  [x] AI-generated assignments (MCQ + short + long)
  [x] Automatic grading with per-question feedback
  [x] Counter-questions to verify genuine understanding
  [x] Fully local inference (Gemma via Ollama, no API key)

---------------------------------------------------------
  HOW GEMMA WAS USED
---------------------------------------------------------
Gemma 4 (gemma4:e2b) is the core intelligence of EduAI.
It is responsible for:

  1. Quiz generation      — assessing student knowledge
  2. Study plan creation  — building personalized 7-day plans
  3. Plan improvement     — adapting plans from real data
  4. Doubt answering      — step-by-step tutoring conversations
  5. Assignment creation  — generating subject-specific questions
  6. Assignment grading   — evaluating answers with feedback
  7. Counter-questioning  — probing whether students truly understand

All model calls go through langchain-ollama's ChatOllama
and OllamaEmbeddings, keeping everything local and free.

---------------------------------------------------------
  LOCAL SETUP
---------------------------------------------------------

Prerequisites:
  * Python 3.12+
  * Node.js 20+
  * PostgreSQL 15+
  * Ollama with gemma4:e2b pulled

  ollama pull gemma4:e2b

Backend:
  cd backend
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env      # fill in DATABASE_URL
  alembic upgrade head
  uvicorn main:app --reload --port 8000

Frontend:
  cd frontend
  npm install
  npm run dev               # http://localhost:3000

---------------------------------------------------------
  CHALLENGES WE FACED
---------------------------------------------------------
  * Structured JSON output from Gemma required careful
    prompt engineering — small models sometimes wrap
    output in markdown code fences, requiring post-
    processing to strip before JSON parsing
  * Keeping Gemma's responses concise and on-topic for
    the tutoring context took multiple prompt iterations
  * Building a full end-to-end feedback loop (assignments
    -> lesson plan improvement) within a single day
  * Managing conversation context efficiently so the
    doubt solver stays coherent across many messages

---------------------------------------------------------
  TEAM
---------------------------------------------------------
  Abdul Basit

  Built in one day at the Gemma AI Hackathon
=========================================================
