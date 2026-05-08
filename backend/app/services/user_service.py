from app.models.user import UserModel
from app.services.auth_service import hash_password, verify_password


def get_users(db):
    return db.query(UserModel).all()


def get_user_by_id(db, user_id: int) -> UserModel | None:
    return db.query(UserModel).filter(UserModel.id == user_id).first()


def get_user_by_username(db, username: str) -> UserModel | None:
    return db.query(UserModel).filter(UserModel.username == username).first()


def create_user(db, user_data: dict) -> UserModel:
    user = UserModel(
        username=user_data["username"],
        password_hash=hash_password(user_data["password"]),
        full_name=user_data.get("full_name"),
        email=user_data.get("email"),
        phone=user_data.get("phone"),
        role=user_data.get("role", "user"),
        is_active=user_data.get("is_active", True),
        can_manage_users=user_data.get("can_manage_users", False),
        can_manage_warid=user_data.get("can_manage_warid", False),
        can_manage_sadir=user_data.get("can_manage_sadir", False),
        can_import_excel=user_data.get("can_import_excel", False),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db, user_id: int, user_data: dict) -> UserModel | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    for field in (
        "full_name", "email", "phone", "role", "is_active",
        "can_manage_users", "can_manage_warid", "can_manage_sadir",
        "can_import_excel",
    ):
        if field in user_data:
            setattr(user, field, user_data[field])
    db.commit()
    db.refresh(user)
    return user


def delete_user(db, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True


def change_password(db, user_id: int, old_password: str, new_password: str) -> bool:
    user = get_user_by_id(db, user_id)
    if not user or not verify_password(old_password, user.password_hash):
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    return True
