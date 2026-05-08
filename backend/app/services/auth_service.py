from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
import bcrypt

from app.models.user import UserModel

SECRET_KEY = "secretariat-railways-2026-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def authenticate_user(db, username: str, password: str) -> UserModel | None:
    user = (
        db.query(UserModel)
        .filter(UserModel.username == username, UserModel.is_active == True)
        .first()
    )
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
