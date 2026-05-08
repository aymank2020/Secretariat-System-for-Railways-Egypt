from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.user import UserModel
from app.services.auth_service import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    verify_token,
)
from app.services.user_service import change_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Schemas ──

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


# ── Dependencies ──

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> UserModel:
    """Extract and verify JWT from Authorization header."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def admin_required(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def warid_permission(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if not current_user.can_manage_warid:
        raise HTTPException(status_code=403, detail="No warid permission")
    return current_user


def sadir_permission(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if not current_user.can_manage_sadir:
        raise HTTPException(status_code=403, detail="No sadir permission")
    return current_user


# ── Endpoints ──

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # update last_login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role},
    )
    return LoginResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "can_manage_warid": user.can_manage_warid,
            "can_manage_sadir": user.can_manage_sadir,
            "can_manage_users": user.can_manage_users,
            "can_import_excel": user.can_import_excel,
        },
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh(current_user: UserModel = Depends(get_current_user)):
    access_token = create_access_token(
        data={"sub": str(current_user.id), "username": current_user.username, "role": current_user.role},
    )
    return LoginResponse(
        access_token=access_token,
        user={
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "can_manage_warid": current_user.can_manage_warid,
            "can_manage_sadir": current_user.can_manage_sadir,
            "can_manage_users": current_user.can_manage_users,
            "can_import_excel": current_user.can_import_excel,
        },
    )


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: UserModel = Depends(get_current_user)):
    return MessageResponse(message="Logged out")


@router.post("/change-password", response_model=MessageResponse)
def change_my_password(
    req: ChangePasswordRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ok = change_password(db, current_user.id, req.old_password, req.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    return MessageResponse(message="Password changed successfully")
