from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import admin_required, get_current_user
from app.models.database import get_db
from app.models.user import UserModel
from app.services.user_service import (
    create_user,
    delete_user,
    get_user_by_id,
    get_user_by_username,
    get_users,
    update_user,
)

router = APIRouter(prefix="/api/users", tags=["users"])


# ── Schemas ──

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    role: str = "user"
    is_active: bool = True
    can_manage_users: bool = False
    can_manage_warid: bool = False
    can_manage_sadir: bool = False
    can_import_excel: bool = False


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    is_active: bool | None = None
    can_manage_users: bool | None = None
    can_manage_warid: bool | None = None
    can_manage_sadir: bool | None = None
    can_import_excel: bool | None = None


# ── Endpoints ──

@router.get("")
def list_users(
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(admin_required),
):
    users = get_users(db)
    return [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "can_manage_users": u.can_manage_users,
            "can_manage_warid": u.can_manage_warid,
            "can_manage_sadir": u.can_manage_sadir,
            "can_import_excel": u.can_import_excel,
            "created_at": str(u.created_at) if u.created_at else None,
            "last_login": str(u.last_login) if u.last_login else None,
        }
        for u in users
    ]


@router.post("")
def add_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(admin_required),
):
    existing = get_user_by_username(db, data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = create_user(db, data.model_dump())
    return {"id": user.id, "username": user.username, "message": "User created"}


@router.put("/{user_id}")
def edit_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(admin_required),
):
    user = update_user(db, user_id, data.model_dump(exclude_none=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "username": user.username, "message": "User updated"}


@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: UserModel = Depends(admin_required),
):
    ok = delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
