# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EduAI** is an AI-powered personalized education platform built for a Gemma hackathon. It uses Google's Gemma 4 model (via Ollama, local inference) to power three features: a Lesson Planner, a Doubt Solver, and an Assignments system.

The repo is a monorepo with two independent sub-projects:

- `backend/` — FastAPI + PostgreSQL + LangChain + Ollama (Gemma 4)
- `frontend/` — Next.js 16 + React 19 + Tailwind CSS 4

---

## Backend

All backend commands must be run from `backend/` with the venv activated.

```bash
cd backend
source venv/bin/activate
```

### Dev server

```bash
uvicorn main:app --reload --port 8000
```

### Database migrations (Alembic)

```bash
# After adding/changing SQLAlchemy models:
alembic revision --autogenerate -m "describe change"
alembic upgrade head

# Downgrade one step:
alembic downgrade -1
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Environment

Copy `backend/.env.example` → `backend/.env` and fill in values. Required:

- `DATABASE_URL` — PostgreSQL connection string (psycopg3 format: `postgresql+psycopg://...`)

No OpenAI key needed — all inference runs locally via Ollama.

---

## Frontend

> **Critical:** This project uses Next.js **16.2.11** and React **19**. APIs, conventions, and file structure may differ significantly from Next.js 13–15. Before writing any frontend code, read the relevant guide in `frontend/node_modules/next/dist/docs/`.

```bash
cd frontend
npm run dev       # dev server — http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
```

---

## AI Model

The project runs **Gemma 4 (gemma4:e2b)** locally via Ollama.

- Ollama must be running (`ollama serve`) before starting the backend.
- The model must be pulled: `ollama pull gemma4:e2b`
- All LLM and embedding calls go through `langchain-ollama` (`ChatOllama` / `OllamaEmbeddings`).
- There is no OpenAI API key — do not add one.

---

## Architecture

### Backend layers

**`backend/main.py`** — FastAPI app entry point (`title="EduAI API"`). Registers all routers and CORS middleware.

**`backend/app/config/`** — Central config hub.

- `settings.py`: Pydantic `Settings` from `.env`. Fields: `DATABASE_URL`, `IS_LLM_LIMIT`, `LLM_REQUESTS_PER_DAY`.
- `database.py`: SQLAlchemy `engine`, `SessionLocal`, `Base`, `get_db` dependency.
- `enums.py`: `ChatRole` (HUMAN/AI), `AIModel` (GEMMA4_E2B).
- `__init__.py`: Re-exports everything — always import from `app.config`.

**`backend/app/ai/`** — AI layer (LangChain + Ollama).

- `llm.py`: `get_llm(temperature)` — cached `ChatOllama` instance using `gemma4:e2b`.
- `embeddings.py`: `get_embeddings()` — cached `OllamaEmbeddings` using `gemma4:e2b`.
- `rag.py`: Full RAG pipeline — PGVector store, history-aware retriever, stuff-documents QA chain. `run_rag_chain()` and `stream_rag_chain()`. Documents filtered by `conversation_id`.
- `memory.py`: Not yet implemented.

**`backend/app/routes/`** — Registered in `main.py` under `/api` prefix (except health).

- `health.py` — `GET /health`
- `lesson_plans.py` — Lesson planner endpoints
- `conversations.py` — Doubt solver chat endpoints
- `assignments.py` — Assignment generation, submission, grading endpoints

**`backend/app/models/`** — SQLAlchemy ORM models (all subclass `Base` from `app.config`).

- `user.py` — User
- `lesson_plan.py` — LessonPlan (stores generated plan JSON)
- `conversation.py` — Conversation + Message (doubt solver history)
- `assignment.py` — Assignment + AssignmentSubmission

**`backend/app/schemas/`** — Pydantic request/response models.

- `lesson_plan.py` — `LessonPlanCreate`, `LessonPlanResponse`, `QuizRequest`
- `conversation.py` — `ConversationResponse`, `MessageResponse`, `AskRequest`
- `assignment.py` — `AssignmentCreate`, `AssignmentResponse`, `SubmitAnswersRequest`, `SubmissionResponse`, `CounterAnswersRequest`, `CounterCheckResponse`

**`backend/app/services/`** — Business logic with all AI prompt engineering.

- `lesson_plan_service.py`:
  - `generate_quiz()` — diagnostic quiz (4–6 questions) before planning
  - `generate_lesson_plan()` — personalized 7-day plan from quiz results
  - `improve_lesson_plan()` — re-generates plan using assignment performance data
  - `list_lesson_plans()`, `get_lesson_plan()`
- `doubt_service.py`:
  - `create_conversation()` — start a tutoring session
  - `ask_doubt()` — send question, get AI tutor response with full history
  - `get_conversation()`, `list_conversations()`
- `assignment_service.py`:
  - `generate_assignment()` — creates MCQ/short/long questions for a topic
  - `submit_assignment()` — grades answers, generates counter-questions for correct ones
  - `check_counter_answers()` — evaluates whether counter-question responses show real understanding
  - `get_assignment()`, `list_assignments()`, `get_submission()`

**`backend/migrations/`** — Alembic migrations. `env.py` reads `DATABASE_URL` from settings and uses `Base.metadata`.

### Frontend structure

Next.js App Router under `frontend/src/app/`:

- `/` (`page.tsx`) — Home / landing
- `/lesson-planner` — Lesson Planner feature
- `/doubt-solver` — Doubt Solver chat
- `/assignments` — Assignments list
- `/assignments/[id]` — Individual assignment

Subdirectories: `components/`, `hooks/`, `providers/`, `services/`, `store/`, `types/`, `utils/`, `config/`, `lib/`.

### Data flow

```
Browser (Next.js :3000)
  └─► FastAPI (:8000) /api/...
        ├─► lesson_plan_service ──► ChatOllama (Gemma 4 e2b via Ollama)
        ├─► doubt_service ────────► ChatOllama (Gemma 4 e2b via Ollama)
        ├─► assignment_service ───► ChatOllama (Gemma 4 e2b via Ollama)
        └─► PostgreSQL (SQLAlchemy)
              ├── lesson_plans
              ├── conversations + messages
              └── assignments + assignment_submissions
```

### Gemma prompt patterns

All services parse structured JSON from Gemma responses. Because small models sometimes wrap output in markdown fences, every service strips ` ```json ` / ` ``` ` before `json.loads()`. When writing new prompts, always instruct the model to "Return ONLY valid JSON (no markdown)".
