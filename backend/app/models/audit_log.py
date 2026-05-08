import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.models.database import Base


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
