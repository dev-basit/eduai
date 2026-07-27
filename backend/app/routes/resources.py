import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_db
from app.schemas.resource import ResourceResponse
from app.services.resource_service import list_resources, get_resource, get_resource_by_plan

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/", response_model=list[ResourceResponse])
def list_all_resources(db: Session = Depends(get_db)):
    return list_resources(db)


@router.get("/plan/{plan_id}", response_model=ResourceResponse)
def get_by_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_resource_by_plan(plan_id, db)


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_by_id(resource_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_resource(resource_id, db)
