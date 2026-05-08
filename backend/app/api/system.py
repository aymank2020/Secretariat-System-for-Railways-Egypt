from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.auth import admin_required
from app.models.audit_log import AuditLogModel
from app.models.database import get_db, engine
from app.models.user import UserModel

router = APIRouter(prefix="/api", tags=["system"])


# ── Endpoints ──

@router.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "ok",
        "service": "Railway Secretariat API",
        "db": db_status,
    }


@router.get("/audit-log")
def list_audit_log(
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(admin_required),
):
    q = db.query(AuditLogModel)
    if table_name:
        q = q.filter(AuditLogModel.table_name == table_name)
    if record_id is not None:
        q = q.filter(AuditLogModel.record_id == record_id)
    logs = q.order_by(AuditLogModel.timestamp.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": log.id,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "action": log.action,
            "user_name": log.user_name,
            "timestamp": str(log.timestamp) if log.timestamp else None,
        }
        for log in logs
    ]
