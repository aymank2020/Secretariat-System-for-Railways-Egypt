"""Seed the database with initial users.

Usage:
    cd backend && python -m app.seed
"""

from app.models.database import Base, SessionLocal, engine
from app.models.user import UserModel  # noqa: F401 — ensure model is loaded
from app.services.auth_service import hash_password

# Ensure tables exist
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    created = []

    try:
        # ── Admin user ──
        existing = db.query(UserModel).filter(UserModel.username == "admin").first()
        if existing:
            print(f"✔ Admin user already exists (id={existing.id})")
        else:
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
            print(f"✅ Created admin user — username: admin / password: admin123")
            created.append("admin")

        # ── Regular user ──
        existing = db.query(UserModel).filter(UserModel.username == "user").first()
        if existing:
            print(f"✔ Regular user already exists (id={existing.id})")
        else:
            user = UserModel(
                username="user",
                password_hash=hash_password("user123"),
                full_name="موظف السكرتارية",
                role="user",
                is_active=True,
                can_manage_users=False,
                can_manage_warid=True,
                can_manage_sadir=True,
                can_import_excel=False,
            )
            db.add(user)
            db.commit()
            print(f"✅ Created regular user — username: user / password: user123")
            created.append("user")

        if not created:
            print("📭 No new users created (both already exist).")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
