from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — ensures all models are registered with Base for Alembic

from app.routes.health import router as health_router
from app.routes.lesson_plans import router as lesson_plans_router
from app.routes.conversations import router as conversations_router
from app.routes.assignments import router as assignments_router

app = FastAPI(title="EduAI API", description="AI-powered education platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(lesson_plans_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(assignments_router, prefix="/api")
