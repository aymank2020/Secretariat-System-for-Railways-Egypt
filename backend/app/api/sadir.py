from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user, sadir_permission
from app.models.database import get_db
from app.models.user import UserModel
from app.services.document_service import (
    batch_delete_sadir,
    create_sadir,
    delete_sadir,
    get_sadir_by_id,
    get_sadir_list,
    update_sadir,
)
from app.services.excel_import_service import import_sadir_from_excel

router = APIRouter(prefix="/api/documents/sadir", tags=["sadir"])


# ── Schemas ──

class SadirCreate(BaseModel):
    qaid_number: str
    qaid_date: datetime
    destination_administration: Optional[str] = None
    letter_number: Optional[str] = None
    letter_date: Optional[datetime] = None
    chairman_incoming_number: Optional[str] = None
    chairman_incoming_date: Optional[datetime] = None
    chairman_return_number: Optional[str] = None
    chairman_return_date: Optional[datetime] = None
    attachment_count: int = 0
    subject: str
    notes: Optional[str] = None
    sent_to1_name: Optional[str] = None
    sent_to1_delivery_date: Optional[datetime] = None
    sent_to2_name: Optional[str] = None
    sent_to2_delivery_date: Optional[datetime] = None
    sent_to3_name: Optional[str] = None
    sent_to3_delivery_date: Optional[datetime] = None
    is_ministry: bool = False
    is_authority: bool = False
    is_other: bool = False
    other_details: Optional[str] = None
    needs_followup: bool = False
    followup_notes: Optional[str] = None
    followup_status: str = "waiting_reply"
    signature_status: str = "pending"
    signature_date: Optional[datetime] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None


class SadirUpdate(BaseModel):
    qaid_number: Optional[str] = None
    qaid_date: Optional[datetime] = None
    destination_administration: Optional[str] = None
    letter_number: Optional[str] = None
    letter_date: Optional[datetime] = None
    chairman_incoming_number: Optional[str] = None
    chairman_incoming_date: Optional[datetime] = None
    chairman_return_number: Optional[str] = None
    chairman_return_date: Optional[datetime] = None
    attachment_count: Optional[int] = None
    subject: Optional[str] = None
    notes: Optional[str] = None
    sent_to1_name: Optional[str] = None
    sent_to1_delivery_date: Optional[datetime] = None
    sent_to2_name: Optional[str] = None
    sent_to2_delivery_date: Optional[datetime] = None
    sent_to3_name: Optional[str] = None
    sent_to3_delivery_date: Optional[datetime] = None
    is_ministry: Optional[bool] = None
    is_authority: Optional[bool] = None
    is_other: Optional[bool] = None
    other_details: Optional[str] = None
    needs_followup: Optional[bool] = None
    followup_notes: Optional[str] = None
    followup_status: Optional[str] = None
    signature_status: Optional[str] = None
    signature_date: Optional[datetime] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None


class BatchDeleteRequest(BaseModel):
    ids: list[int]


# ── Endpoints ──

@router.get("")
def list_sadir(
    skip: int = 0,
    limit: int = 50,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    subject: Optional[str] = None,
    destination: Optional[str] = None,
    followup_status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(sadir_permission),
):
    filters = {}
    if date_from:
        filters["date_from"] = datetime.fromisoformat(date_from)
    if date_to:
        filters["date_to"] = datetime.fromisoformat(date_to)
    if subject:
        filters["subject"] = subject
    if destination:
        filters["destination_administration"] = destination
    if followup_status:
        filters["needs_followup"] = True

    records = get_sadir_list(db, skip=skip, limit=limit, filters=filters)
    return [
        {
            "id": r.id,
            "qaid_number": r.qaid_number,
            "qaid_date": str(r.qaid_date) if r.qaid_date else None,
            "destination_administration": r.destination_administration,
            "letter_number": r.letter_number,
            "subject": r.subject,
            "needs_followup": r.needs_followup,
            "followup_status": r.followup_status,
            "signature_status": r.signature_status,
            "created_at": str(r.created_at) if r.created_at else None,
        }
        for r in records
    ]


@router.post("")
def add_sadir(
    data: SadirCreate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(sadir_permission),
):
    sadir = create_sadir(db, data.model_dump(), user.id, user.full_name or user.username)
    return {"id": sadir.id, "message": "Sadir created"}


@router.get("/{sadir_id}")
def get_sadir(
    sadir_id: int,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(sadir_permission),
):
    sadir = get_sadir_by_id(db, sadir_id)
    if not sadir:
        raise HTTPException(status_code=404, detail="Sadir not found")

    result = {c.name: getattr(sadir, c.name) for c in sadir.__table__.columns}
    for k, v in result.items():
        if isinstance(v, datetime):
            result[k] = v.isoformat()
    return result


@router.put("/{sadir_id}")
def edit_sadir(
    sadir_id: int,
    data: SadirUpdate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(sadir_permission),
):
    payload = data.model_dump(exclude_none=True)
    payload["_user_id"] = user.id
    payload["_user_name"] = user.full_name or user.username
    sadir = update_sadir(db, sadir_id, payload)
    if not sadir:
        raise HTTPException(status_code=404, detail="Sadir not found")
    return {"message": "Sadir updated"}


@router.delete("/{sadir_id}")
def remove_sadir(
    sadir_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(sadir_permission),
):
    ok = delete_sadir(db, sadir_id, user.id, user.full_name or user.username)
    if not ok:
        raise HTTPException(status_code=404, detail="Sadir not found")
    return {"message": "Sadir deleted (archived)"}


@router.post("/batch-delete")
def batch_remove_sadir(
    req: BatchDeleteRequest,
    db: Session = Depends(get_db),
    user: UserModel = Depends(sadir_permission),
):
    count = batch_delete_sadir(db, req.ids, user.id, user.full_name or user.username)
    return {"message": f"{count} sadir records deleted", "deleted_count": count}


@router.post("/import")
def import_sadir_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: UserModel = Depends(sadir_permission),
):
    content = file.file.read()
    result = import_sadir_from_excel(db, content, file.filename, user.id, user.full_name or user.username)
    return result
