from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.models.database import get_db
from app.models.classification import ClassificationOptionModel
from app.models.user import UserModel
from app.services.document_service import (
    get_deleted_records,
    get_statistics,
    restore_deleted_record,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])


# ── Schemas ──

class RestoreRequest(BaseModel):
    record_id: int


class ClassificationCreate(BaseModel):
    document_type: str
    option_name: str


# ── Endpoints ──

@router.get("/deleted")
def list_deleted(
    document_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(get_current_user),
):
    records = get_deleted_records(db, document_type=document_type)
    return [
        {
            "id": r.id,
            "document_type": r.document_type,
            "original_record_id": r.original_record_id,
            "deleted_at": str(r.deleted_at) if r.deleted_at else None,
            "deleted_by_name": r.deleted_by_name,
        }
        for r in records
    ]


@router.post("/deleted/restore")
def restore(
    req: RestoreRequest,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(get_current_user),
):
    ok = restore_deleted_record(db, req.record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Record not found or cannot be restored")
    return {"message": "Record restored successfully"}


@router.get("/statistics")
def stats(
    db: Session = Depends(get_db),
    _user: UserModel = Depends(get_current_user),
):
    return get_statistics(db)


@router.get("/classification/{document_type}")
def list_classification(
    document_type: str,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(get_current_user),
):
    options = (
        db.query(ClassificationOptionModel)
        .filter(ClassificationOptionModel.document_type == document_type)
        .all()
    )
    return [
        {"id": o.id, "option_name": o.option_name, "created_at": str(o.created_at) if o.created_at else None}
        for o in options
    ]


@router.post("/classification")
def add_classification(
    data: ClassificationCreate,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(get_current_user),
):
    opt = ClassificationOptionModel(document_type=data.document_type, option_name=data.option_name)
    db.add(opt)
    db.commit()
    db.refresh(opt)
    return {"id": opt.id, "option_name": opt.option_name, "message": "Classification option added"}
