from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user, warid_permission
from app.models.database import get_db
from app.models.user import UserModel
from app.services.document_service import (
    batch_delete_warid,
    create_warid,
    delete_warid,
    get_warid_by_id,
    get_warid_list,
    update_warid,
)
from app.services.excel_import_service import import_warid_from_excel

router = APIRouter(prefix="/api/documents/warid", tags=["warid"])


# ── Schemas ──

class WaridCreate(BaseModel):
    qaid_number: str
    qaid_date: datetime
    source_administration: str
    letter_number: Optional[str] = None
    letter_date: Optional[datetime] = None
    chairman_incoming_number: Optional[str] = None
    chairman_incoming_date: Optional[datetime] = None
    chairman_return_number: Optional[str] = None
    chairman_return_date: Optional[datetime] = None
    attachment_count: int = 0
    subject: str
    notes: Optional[str] = None
    recipient1_name: Optional[str] = None
    recipient1_delivery_date: Optional[datetime] = None
    recipient2_name: Optional[str] = None
    recipient2_delivery_date: Optional[datetime] = None
    recipient3_name: Optional[str] = None
    recipient3_delivery_date: Optional[datetime] = None
    is_ministry: bool = False
    is_authority: bool = False
    is_other: bool = False
    other_details: Optional[str] = None
    needs_followup: bool = False
    followup_notes: Optional[str] = None
    followup_status: str = "waiting_reply"
    file_name: Optional[str] = None
    file_path: Optional[str] = None


class WaridUpdate(BaseModel):
    qaid_number: Optional[str] = None
    qaid_date: Optional[datetime] = None
    source_administration: Optional[str] = None
    letter_number: Optional[str] = None
    letter_date: Optional[datetime] = None
    chairman_incoming_number: Optional[str] = None
    chairman_incoming_date: Optional[datetime] = None
    chairman_return_number: Optional[str] = None
    chairman_return_date: Optional[datetime] = None
    attachment_count: Optional[int] = None
    subject: Optional[str] = None
    notes: Optional[str] = None
    recipient1_name: Optional[str] = None
    recipient1_delivery_date: Optional[datetime] = None
    recipient2_name: Optional[str] = None
    recipient2_delivery_date: Optional[datetime] = None
    recipient3_name: Optional[str] = None
    recipient3_delivery_date: Optional[datetime] = None
    is_ministry: Optional[bool] = None
    is_authority: Optional[bool] = None
    is_other: Optional[bool] = None
    other_details: Optional[str] = None
    needs_followup: Optional[bool] = None
    followup_notes: Optional[str] = None
    followup_status: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None


class BatchDeleteRequest(BaseModel):
    ids: list[int]


# ── Endpoints ──

@router.get("")
def list_warid(
    skip: int = 0,
    limit: int = 50,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    subject: Optional[str] = None,
    source: Optional[str] = None,
    followup_status: Optional[str] = None,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(warid_permission),
):
    filters = {}
    if date_from:
        filters["date_from"] = datetime.fromisoformat(date_from)
    if date_to:
        filters["date_to"] = datetime.fromisoformat(date_to)
    if subject:
        filters["subject"] = subject
    if source:
        filters["source_administration"] = source
    if followup_status:
        filters["needs_followup"] = True

    records = get_warid_list(db, skip=skip, limit=limit, filters=filters)
    return [
        {
            "id": r.id,
            "qaid_number": r.qaid_number,
            "qaid_date": str(r.qaid_date) if r.qaid_date else None,
            "source_administration": r.source_administration,
            "letter_number": r.letter_number,
            "subject": r.subject,
            "needs_followup": r.needs_followup,
            "followup_status": r.followup_status,
            "created_at": str(r.created_at) if r.created_at else None,
        }
        for r in records
    ]


@router.post("")
def add_warid(
    data: WaridCreate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(warid_permission),
):
    warid = create_warid(db, data.model_dump(), user.id, user.full_name or user.username)
    return {"id": warid.id, "message": "Warid created"}


@router.get("/{warid_id}")
def get_warid(
    warid_id: int,
    db: Session = Depends(get_db),
    _user: UserModel = Depends(warid_permission),
):
    warid = get_warid_by_id(db, warid_id)
    if not warid:
        raise HTTPException(status_code=404, detail="Warid not found")

    result = {c.name: getattr(warid, c.name) for c in warid.__table__.columns}
    # convert datetime to string
    for k, v in result.items():
        if isinstance(v, datetime):
            result[k] = v.isoformat()
    return result


@router.put("/{warid_id}")
def edit_warid(
    warid_id: int,
    data: WaridUpdate,
    db: Session = Depends(get_db),
    user: UserModel = Depends(warid_permission),
):
    payload = data.model_dump(exclude_none=True)
    payload["_user_id"] = user.id
    payload["_user_name"] = user.full_name or user.username
    warid = update_warid(db, warid_id, payload)
    if not warid:
        raise HTTPException(status_code=404, detail="Warid not found")
    return {"message": "Warid updated"}


@router.delete("/{warid_id}")
def remove_warid(
    warid_id: int,
    db: Session = Depends(get_db),
    user: UserModel = Depends(warid_permission),
):
    ok = delete_warid(db, warid_id, user.id, user.full_name or user.username)
    if not ok:
        raise HTTPException(status_code=404, detail="Warid not found")
    return {"message": "Warid deleted (archived)"}


@router.post("/batch-delete")
def batch_remove_warid(
    req: BatchDeleteRequest,
    db: Session = Depends(get_db),
    user: UserModel = Depends(warid_permission),
):
    count = batch_delete_warid(db, req.ids, user.id, user.full_name or user.username)
    return {"message": f"{count} warid records deleted", "deleted_count": count}


@router.post("/import")
def import_warid_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: UserModel = Depends(warid_permission),
):
    content = file.file.read()
    result = import_warid_from_excel(db, content, file.filename, user.id, user.full_name or user.username)
    return result
