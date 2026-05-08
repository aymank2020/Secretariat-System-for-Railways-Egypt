import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.models.database import Base


class ClassificationOptionModel(Base):
    __tablename__ = "classification_options"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_type = Column(String(50), nullable=False)
    option_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
