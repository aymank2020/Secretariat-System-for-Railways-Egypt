# Railway Secretariat System

Arabic correspondence management: a FastAPI/SQLAlchemy API under `backend` and a
Next.js interface under `frontend`.

Configure a private signing key before starting the backend; the example file
contains names only and no usable credentials:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SECRET_KEY = python -c "import secrets; print(secrets.token_hex(32))"
$env:DATABASE_URL = "sqlite:///./secretariat.db"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Provide the same private `SECRET_KEY` on each restart. Replacing it invalidates
previous tokens. The application rejects missing or shorter-than-32-character
keys instead of falling back to a published secret. User provisioning remains
the existing explicit seed/admin flow.

```powershell
cd frontend
npm ci
npm run dev
```

Verification:

```powershell
cd backend
python -m pytest tests/ -q
# In frontend:
npm run build
```

API tests use an in-memory SQLite fixture; they do not drop or recreate the
tracked `backend/test_secretariat.db` or the configured application database.
