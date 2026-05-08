import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.models.database import Base


class DeletedRecordModel(Base):
    __tablename__ = "deleted_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_type = Column(String(50), nullable=False)
    original_record_id = Column(Integer, nullable=True)
    archived_payload = Column(Text, nullable=False)
    deleted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    deleted_by = Column(Integer, nullable=True)
    deleted_by_name = Column(String(255), nullable=True)
