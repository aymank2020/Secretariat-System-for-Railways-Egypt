import os
import subprocess
import sys

import pytest


@pytest.mark.parametrize("key", [None, "short"])
def test_startup_rejects_missing_or_weak_signing_key(key):
    env = dict(os.environ)
    env.pop("SECRET_KEY", None)
    if key is not None:
        env["SECRET_KEY"] = key
    result = subprocess.run([sys.executable, "-c", "from app.services import auth_service"], env=env, capture_output=True, text=True)
    assert result.returncode != 0
    assert "SECRET_KEY must be configured" in result.stderr


def test_authentication_rejects_wrongly_signed_token(client):
    from jose import jwt
    token = jwt.encode({"sub": "1"}, "unrelated-test-key-with-at-least-32-characters", algorithm="HS256")
    response = client.get("/api/documents/statistics", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
