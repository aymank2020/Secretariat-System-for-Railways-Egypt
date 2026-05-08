import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.database import Base, get_db
from app.services.auth_service import hash_password

# ── In-memory SQLite for tests ──

TEST_DATABASE_URL = "sqlite:///./test_secretariat.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a clean DB session for each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """FastAPI TestClient with overridden DB dependency."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client):
    """Seed the admin user and return a valid Bearer token."""
    from app.models.user import UserModel

    db = TestingSessionLocal()
    try:
        admin = UserModel(
            username="admin",
            password_hash=hash_password("admin123"),
            full_name="مدير النظام",
            role="admin",
            is_active=True,
            can_manage_users=True,
            can_manage_warid=True,
            can_manage_sadir=True,
            can_import_excel=True,
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()

    resp = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
