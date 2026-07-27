import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_db
from app.schemas.assignment import (
    AssignmentCreate, AssignmentResponse, CounterAnswersRequest,
    CounterCheckResponse, SubmitAnswersRequest, SubmissionResponse,
)
from app.services.assignment_service import (
    check_counter_answers, generate_assignment, get_assignment,
    get_submission, list_assignments, submit_assignment,
)

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.post("/generate", response_model=AssignmentResponse, status_code=201)
def generate(body: AssignmentCreate, db: Session = Depends(get_db)):
    return generate_assignment(body, db)


@router.get("/", response_model=list[AssignmentResponse])
def list_all(db: Session = Depends(get_db)):
    return list_assignments(db)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_one(assignment_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_assignment(assignment_id, db)


@router.get("/{assignment_id}/submission", response_model=SubmissionResponse)
def get_latest_submission(assignment_id: uuid.UUID, db: Session = Depends(get_db)):
    from app.models.assignment import AssignmentSubmission
    from fastapi import HTTPException
    sub = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .order_by(AssignmentSubmission.created_at.desc())
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="No submission found")
    return SubmissionResponse.model_validate(sub)


@router.post("/{assignment_id}/submit", response_model=SubmissionResponse, status_code=201)
def submit(assignment_id: uuid.UUID, body: SubmitAnswersRequest, db: Session = Depends(get_db)):
    return submit_assignment(assignment_id, body, db)


@router.post("/{assignment_id}/submissions/{submission_id}/verify", response_model=CounterCheckResponse)
def verify_understanding(assignment_id: uuid.UUID, submission_id: uuid.UUID, body: CounterAnswersRequest, db: Session = Depends(get_db)):
    return check_counter_answers(assignment_id, submission_id, body, db)


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
def get_sub(submission_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_submission(submission_id, db)
