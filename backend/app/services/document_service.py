import datetime
import json

from sqlalchemy import func

from app.models.audit_log import AuditLogModel
from app.models.deleted_record import DeletedRecordModel
from app.models.sadir import SadirModel
from app.models.warid import WaridModel


# ──────────────────────────────────────────────
#  Warid (incoming)
# ──────────────────────────────────────────────

def _warid_from_dict(data: dict) -> WaridModel:
    obj = WaridModel()
    for field in (
        "qaid_number", "qaid_date", "source_administration",
        "letter_number", "letter_date",
        "chairman_incoming_number", "chairman_incoming_date",
        "chairman_return_number", "chairman_return_date",
        "attachment_count", "subject", "notes",
        "recipient1_name", "recipient1_delivery_date",
        "recipient2_name", "recipient2_delivery_date",
        "recipient3_name", "recipient3_delivery_date",
        "is_ministry", "is_authority", "is_other", "other_details",
        "file_name", "file_path",
        "needs_followup", "followup_notes",
        "followup_status", "followup_file_name", "followup_file_path",
        "created_by", "created_by_name",
    ):
        if field in data:
            setattr(obj, field, data[field])
    return obj


def create_warid(db, data: dict, user_id: int, user_name: str) -> WaridModel:
    data["created_by"] = user_id
    data["created_by_name"] = user_name
    warid = _warid_from_dict(data)
    db.add(warid)
    db.commit()
    db.refresh(warid)

    _log(db, "warid", warid.id, "CREATE", None, _serialize(warid), user_id, user_name)
    return warid


def get_warid_list(db, skip: int = 0, limit: int = 50, filters: dict = None):
    q = db.query(WaridModel)
    if filters:
        if filters.get("qaid_number"):
            q = q.filter(WaridModel.qaid_number.ilike(f"%{filters['qaid_number']}%"))
        if filters.get("subject"):
            q = q.filter(WaridModel.subject.ilike(f"%{filters['subject']}%"))
        if filters.get("source_administration"):
            q = q.filter(WaridModel.source_administration.ilike(f"%{filters['source_administration']}%"))
        if filters.get("date_from"):
            q = q.filter(WaridModel.qaid_date >= filters["date_from"])
        if filters.get("date_to"):
            q = q.filter(WaridModel.qaid_date <= filters["date_to"])
        if filters.get("needs_followup") is not None:
            q = q.filter(WaridModel.needs_followup == filters["needs_followup"])
    return q.order_by(WaridModel.id.desc()).offset(skip).limit(limit).all()


def get_warid_by_id(db, warid_id: int) -> WaridModel | None:
    return db.query(WaridModel).filter(WaridModel.id == warid_id).first()


def update_warid(db, warid_id: int, data: dict) -> WaridModel | None:
    warid = get_warid_by_id(db, warid_id)
    if not warid:
        return None
    old = _serialize(warid)
    for field in (
        "qaid_number", "qaid_date", "source_administration",
        "letter_number", "letter_date",
        "chairman_incoming_number", "chairman_incoming_date",
        "chairman_return_number", "chairman_return_date",
        "attachment_count", "subject", "notes",
        "recipient1_name", "recipient1_delivery_date",
        "recipient2_name", "recipient2_delivery_date",
        "recipient3_name", "recipient3_delivery_date",
        "is_ministry", "is_authority", "is_other", "other_details",
        "file_name", "file_path",
        "needs_followup", "followup_notes",
        "followup_status", "followup_file_name", "followup_file_path",
    ):
        if field in data:
            setattr(warid, field, data[field])
    warid.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(warid)
    _log(db, "warid", warid_id, "UPDATE", old, _serialize(warid), data.get("_user_id"), data.get("_user_name"))
    return warid


def delete_warid(db, warid_id: int, user_id: int, user_name: str) -> bool:
    warid = get_warid_by_id(db, warid_id)
    if not warid:
        return False

    # archive
    payload = json.dumps(_serialize(warid), ensure_ascii=False, default=str)
    deleted = DeletedRecordModel(
        document_type="warid",
        original_record_id=warid_id,
        archived_payload=payload,
        deleted_by=user_id,
        deleted_by_name=user_name,
    )
    db.add(deleted)
    db.delete(warid)
    db.commit()
    _log(db, "warid", warid_id, "DELETE", _serialize(warid), None, user_id, user_name)
    return True


def batch_delete_warid(db, ids: list, user_id: int, user_name: str) -> int:
    count = 0
    for i in ids:
        if delete_warid(db, i, user_id, user_name):
            count += 1
    return count


# ──────────────────────────────────────────────
#  Sadir (outgoing)
# ──────────────────────────────────────────────

def _sadir_from_dict(data: dict) -> SadirModel:
    obj = SadirModel()
    for field in (
        "qaid_number", "qaid_date", "destination_administration",
        "letter_number", "letter_date",
        "chairman_incoming_number", "chairman_incoming_date",
        "chairman_return_number", "chairman_return_date",
        "attachment_count", "subject", "notes",
        "sent_to1_name", "sent_to1_delivery_date",
        "sent_to2_name", "sent_to2_delivery_date",
        "sent_to3_name", "sent_to3_delivery_date",
        "is_ministry", "is_authority", "is_other", "other_details",
        "file_name", "file_path",
        "needs_followup", "followup_notes",
        "followup_status", "followup_file_name", "followup_file_path",
        "signature_status", "signature_date",
        "created_by", "created_by_name",
    ):
        if field in data:
            setattr(obj, field, data[field])
    return obj


def create_sadir(db, data: dict, user_id: int, user_name: str) -> SadirModel:
    data["created_by"] = user_id
    data["created_by_name"] = user_name
    sadir = _sadir_from_dict(data)
    db.add(sadir)
    db.commit()
    db.refresh(sadir)
    _log(db, "sadir", sadir.id, "CREATE", None, _serialize(sadir), user_id, user_name)
    return sadir


def get_sadir_list(db, skip: int = 0, limit: int = 50, filters: dict = None):
    q = db.query(SadirModel)
    if filters:
        if filters.get("qaid_number"):
            q = q.filter(SadirModel.qaid_number.ilike(f"%{filters['qaid_number']}%"))
        if filters.get("subject"):
            q = q.filter(SadirModel.subject.ilike(f"%{filters['subject']}%"))
        if filters.get("destination_administration"):
            q = q.filter(SadirModel.destination_administration.ilike(f"%{filters['destination_administration']}%"))
        if filters.get("date_from"):
            q = q.filter(SadirModel.qaid_date >= filters["date_from"])
        if filters.get("date_to"):
            q = q.filter(SadirModel.qaid_date <= filters["date_to"])
        if filters.get("needs_followup") is not None:
            q = q.filter(SadirModel.needs_followup == filters["needs_followup"])
    return q.order_by(SadirModel.id.desc()).offset(skip).limit(limit).all()


def get_sadir_by_id(db, sadir_id: int) -> SadirModel | None:
    return db.query(SadirModel).filter(SadirModel.id == sadir_id).first()


def update_sadir(db, sadir_id: int, data: dict) -> SadirModel | None:
    sadir = get_sadir_by_id(db, sadir_id)
    if not sadir:
        return None
    old = _serialize(sadir)
    for field in (
        "qaid_number", "qaid_date", "destination_administration",
        "letter_number", "letter_date",
        "chairman_incoming_number", "chairman_incoming_date",
        "chairman_return_number", "chairman_return_date",
        "attachment_count", "subject", "notes",
        "sent_to1_name", "sent_to1_delivery_date",
        "sent_to2_name", "sent_to2_delivery_date",
        "sent_to3_name", "sent_to3_delivery_date",
        "is_ministry", "is_authority", "is_other", "other_details",
        "file_name", "file_path",
        "needs_followup", "followup_notes",
        "followup_status", "followup_file_name", "followup_file_path",
        "signature_status", "signature_date",
    ):
        if field in data:
            setattr(sadir, field, data[field])
    sadir.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(sadir)
    _log(db, "sadir", sadir_id, "UPDATE", old, _serialize(sadir), data.get("_user_id"), data.get("_user_name"))
    return sadir


def delete_sadir(db, sadir_id: int, user_id: int, user_name: str) -> bool:
    sadir = get_sadir_by_id(db, sadir_id)
    if not sadir:
        return False
    payload = json.dumps(_serialize(sadir), ensure_ascii=False, default=str)
    deleted = DeletedRecordModel(
        document_type="sadir",
        original_record_id=sadir_id,
        archived_payload=payload,
        deleted_by=user_id,
        deleted_by_name=user_name,
    )
    db.add(deleted)
    db.delete(sadir)
    db.commit()
    _log(db, "sadir", sadir_id, "DELETE", _serialize(sadir), None, user_id, user_name)
    return True


def batch_delete_sadir(db, ids: list, user_id: int, user_name: str) -> int:
    count = 0
    for i in ids:
        if delete_sadir(db, i, user_id, user_name):
            count += 1
    return count


# ──────────────────────────────────────────────
#  Deleted records
# ──────────────────────────────────────────────

def get_deleted_records(db, document_type: str = None):
    q = db.query(DeletedRecordModel)
    if document_type:
        q = q.filter(DeletedRecordModel.document_type == document_type)
    return q.order_by(DeletedRecordModel.deleted_at.desc()).all()


def _parse_datetime(val):
    """Convert ISO string back to datetime if needed."""
    if val is None:
        return None
    if isinstance(val, datetime.datetime):
        return val
    if isinstance(val, str):
        for fmt in (
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S",
        ):
            try:
                return datetime.datetime.strptime(val, fmt)
            except ValueError:
                continue
    return val


def restore_deleted_record(db, record_id: int) -> bool:
    rec = db.query(DeletedRecordModel).filter(DeletedRecordModel.id == record_id).first()
    if not rec:
        return False
    payload = json.loads(rec.archived_payload)
    doc_type = rec.document_type

    if doc_type == "warid":
        obj = WaridModel()
    elif doc_type == "sadir":
        obj = SadirModel()
    else:
        return False

    # SQLite datetime columns only accept datetime objects (not strings)
    DATE_FIELDS = {
        "qaid_date", "letter_date", "chairman_incoming_date",
        "chairman_return_date", "recipient1_delivery_date",
        "recipient2_delivery_date", "recipient3_delivery_date",
        "sent_to1_delivery_date", "sent_to2_delivery_date",
        "sent_to3_delivery_date", "signature_date",
        "created_at", "updated_at",
    }

    for key, val in payload.items():
        if hasattr(obj, key) and key != "id":
            if key in DATE_FIELDS:
                val = _parse_datetime(val)
            setattr(obj, key, val)

    db.add(obj)
    db.delete(rec)
    db.commit()
    return True


# ──────────────────────────────────────────────
#  Statistics
# ──────────────────────────────────────────────

def get_statistics(db) -> dict:
    now = datetime.datetime.utcnow()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    warid_count = db.query(func.count(WaridModel.id)).scalar() or 0
    sadir_count = db.query(func.count(SadirModel.id)).scalar() or 0

    pending_followups = (
        db.query(func.count(WaridModel.id))
        .filter(WaridModel.needs_followup == True, WaridModel.followup_status == "waiting_reply")
        .scalar()
        or 0
    ) + (
        db.query(func.count(SadirModel.id))
        .filter(SadirModel.needs_followup == True, SadirModel.followup_status == "waiting_reply")
        .scalar()
        or 0
    )

    warid_monthly = (
        db.query(WaridModel)
        .filter(WaridModel.created_at >= first_of_month)
        .count()
    )
    sadir_monthly = (
        db.query(SadirModel)
        .filter(SadirModel.created_at >= first_of_month)
        .count()
    )

    return {
        "warid_count": warid_count,
        "sadir_count": sadir_count,
        "pending_followups": pending_followups,
        "monthly_counts": {
            "warid": warid_monthly,
            "sadir": sadir_monthly,
        },
    }


# ──────────────────────────────────────────────
#  Internal helpers
# ──────────────────────────────────────────────

def _serialize(obj):
    """Convert a model instance to a plain dict for audit logging."""
    d = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, (datetime.datetime, datetime.date)):
            val = val.isoformat()
        d[col.name] = val
    return d


def _log(db, table_name, record_id, action, old, new, user_id, user_name):
    log = AuditLogModel(
        table_name=table_name,
        record_id=record_id,
        action=action,
        old_values=json.dumps(old, ensure_ascii=False, default=str) if old else None,
        new_values=json.dumps(new, ensure_ascii=False, default=str) if new else None,
        user_id=user_id,
        user_name=user_name,
    )
    db.add(log)
    db.commit()
