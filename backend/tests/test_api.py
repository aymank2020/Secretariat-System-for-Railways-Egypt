import pytest


# ──────────────────────────────────────────────
#  Health
# ──────────────────────────────────────────────

def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "Railway Secretariat API"
    assert data["db"] == "connected"


# ──────────────────────────────────────────────
#  Auth
# ──────────────────────────────────────────────

def test_login_success(client, db):
    # seed admin directly using the db fixture
    from app.models.user import UserModel
    from app.services.auth_service import hash_password

    admin = UserModel(
        username="admin",
        password_hash=hash_password("admin123"),
        full_name="Admin",
        role="admin",
        is_active=True,
        can_manage_warid=True,
        can_manage_sadir=True,
        can_manage_users=True,
    )
    db.add(admin)
    db.commit()

    resp = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"


def test_login_failure(client):
    resp = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrongpass",
    })
    assert resp.status_code == 401


# ──────────────────────────────────────────────
#  Warid CRUD
# ──────────────────────────────────────────────

WARID_PAYLOAD = {
    "qaid_number": "2026-001",
    "qaid_date": "2026-05-08T00:00:00",
    "source_administration": "هيئة السكك الحديدية",
    "subject": "خطاب اختبار",
    "notes": "ملاحظات اختبار",
    "attachment_count": 2,
}


def test_create_warid(client, auth_headers):
    resp = client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1
    assert data["message"] == "Warid created"


def test_list_warid(client, auth_headers):
    # create one first
    client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)
    resp = client.get("/api/documents/warid", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["subject"] == "خطاب اختبار"


def test_get_warid_by_id(client, auth_headers):
    client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)
    resp = client.get("/api/documents/warid/1", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["subject"] == "خطاب اختبار"
    assert data["source_administration"] == "هيئة السكك الحديدية"


def test_update_warid(client, auth_headers):
    client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)
    resp = client.put("/api/documents/warid/1", json={"subject": "معدل"}, headers=auth_headers)
    assert resp.status_code == 200
    # verify
    resp2 = client.get("/api/documents/warid/1", headers=auth_headers)
    assert resp2.json()["subject"] == "معدل"


def test_delete_warid_soft(client, auth_headers):
    client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)
    resp = client.delete("/api/documents/warid/1", headers=auth_headers)
    assert resp.status_code == 200
    assert "deleted" in resp.json()["message"].lower()

    # verify not in warid list
    resp2 = client.get("/api/documents/warid", headers=auth_headers)
    assert len(resp2.json()) == 0

    # verify in deleted records
    resp3 = client.get("/api/documents/deleted", headers=auth_headers)
    assert len(resp3.json()) == 1


# ──────────────────────────────────────────────
#  Sadir CRUD
# ──────────────────────────────────────────────

SADIR_PAYLOAD = {
    "qaid_number": "2026-001",
    "qaid_date": "2026-05-08T00:00:00",
    "destination_administration": "وزارة النقل",
    "subject": "كتاب صادر تجريبي",
    "signature_status": "pending",
}


def test_create_sadir(client, auth_headers):
    resp = client.post("/api/documents/sadir", json=SADIR_PAYLOAD, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Sadir created"


def test_list_sadir(client, auth_headers):
    client.post("/api/documents/sadir", json=SADIR_PAYLOAD, headers=auth_headers)
    resp = client.get("/api/documents/sadir", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ──────────────────────────────────────────────
#  Statistics
# ──────────────────────────────────────────────

def test_get_statistics(client, auth_headers):
    # create one warid + one sadir
    client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)
    client.post("/api/documents/sadir", json=SADIR_PAYLOAD, headers=auth_headers)

    resp = client.get("/api/documents/statistics", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["warid_count"] == 1
    assert data["sadir_count"] == 1


# ──────────────────────────────────────────────
#  Deleted records flow (full cycle)
# ──────────────────────────────────────────────

def test_deleted_records_flow(client, auth_headers):
    # create
    client.post("/api/documents/warid", json=WARID_PAYLOAD, headers=auth_headers)

    # delete
    client.delete("/api/documents/warid/1", headers=auth_headers)

    # list deleted
    resp = client.get("/api/documents/deleted", headers=auth_headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["original_record_id"] == 1
    assert resp.json()[0]["document_type"] == "warid"

    # restore
    resp2 = client.post("/api/documents/deleted/restore", json={"record_id": 1}, headers=auth_headers)
    assert resp2.status_code == 200

    # verify restored
    resp3 = client.get("/api/documents/warid/1", headers=auth_headers)
    assert resp3.status_code == 200
    assert resp3.json()["subject"] == "خطاب اختبار"


# ──────────────────────────────────────────────
#  Unauthorized access
# ──────────────────────────────────────────────

def test_unauthorized_access(client):
    resp = client.get("/api/documents/warid")
    assert resp.status_code == 401

    resp2 = client.get("/api/documents/sadir")
    assert resp2.status_code == 401

    resp3 = client.get("/api/users")
    assert resp3.status_code == 401

    resp4 = client.get("/api/documents/statistics")
    assert resp4.status_code == 401


# ──────────────────────────────────────────────
#  Classification CRUD
# ──────────────────────────────────────────────

def test_classification_crud(client, auth_headers):
    # create
    resp = client.post(
        "/api/documents/classification",
        json={"document_type": "warid", "option_name": "وزارة النقل"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["option_name"] == "وزارة النقل"

    # list
    resp2 = client.get("/api/documents/classification/warid", headers=auth_headers)
    assert resp2.status_code == 200
    assert len(resp2.json()) == 1
    assert resp2.json()[0]["option_name"] == "وزارة النقل"
