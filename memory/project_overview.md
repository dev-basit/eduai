---
name: project-overview
description: EduAI hackathon MVP — 6 AI education features, tech stack, DB, run commands
metadata:
  type: project
---

EduAI hackathon MVP with 6 AI-powered education features.

**Why:** Hackathon project to demo end-to-end AI education capabilities.

**How to apply:** Use this context when adding features or debugging. The venv at `backend/venv` symlinks to the glowbymiral venv at `/Users/basit/data/Coding/ai/glowbymiral/backend/venv`. Run Python commands using that path directly.

## Run commands
- Backend: `/Users/basit/data/Coding/ai/glowbymiral/backend/venv/bin/uvicorn main:app --port 8000 --reload` (from `backend/`)
- Frontend: `npm run dev` (from `frontend/`) → port 3000
- Migrations: `/Users/basit/data/Coding/ai/glowbymiral/backend/venv/bin/python -m alembic upgrade head` (from `backend/`)

## Database
- PostgreSQL on port 5432 (not 5431)
- DB name: `edu_ai`
- URL: `postgresql+psycopg://basit@localhost:5432/edu_ai`

## Features built
1. **Lesson Planner** — `POST /api/lesson-plans/generate` → 7-day plan as JSONB
2. **Doubt Solver** — `POST /api/conversations/` + `POST /api/conversations/{id}/ask`
3. **Assignment Generator** — `POST /api/assignments/generate`
4. **Assignment Checker** — `POST /api/assignments/{id}/submit`
5. **Exam Generator** — `POST /api/exams/generate`
6. **Exam Checker** — `POST /api/exams/{id}/submit`

## Key fix
`database.py` uses `settings.DATABASE_URL.get_secret_value()` (not `str()` which returns `**********`).
`migrations/env.py` also uses `.get_secret_value()`.
