import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.models.database import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    can_manage_users = Column(Boolean, default=False, nullable=False)
    can_manage_warid = Column(Boolean, default=False, nullable=False)
    can_manage_sadir = Column(Boolean, default=False, nullable=False)
    can_import_excel = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)
