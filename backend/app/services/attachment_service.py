import datetime
import os
import uuid

# Allowed extensions for uploaded attachments
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".png", ".doc", ".docx"}
UPLOAD_BASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


def upload_attachment(file, document_type: str, record_id: int) -> dict:
    if not _allowed_file(file.filename):
        raise ValueError(f"File type not allowed: {file.filename}")

    dir_path = os.path.join(UPLOAD_BASE, document_type, str(record_id))
    _ensure_dir(dir_path)

    # keep original name but prefix with uuid to avoid collisions
    _, ext = os.path.splitext(file.filename)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(dir_path, stored_name)

    content = file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "file_name": file.filename,
        "file_path": file_path,
    }


def get_attachment_path(document_type: str, file_name: str) -> str | None:
    """Walk upload directories to find a file by its original name."""
    base = os.path.join(UPLOAD_BASE, document_type)
    if not os.path.isdir(base):
        return None

    for record_dir in os.listdir(base):
        record_path = os.path.join(base, record_dir)
        if not os.path.isdir(record_path):
            continue
        for fname in os.listdir(record_path):
            # stored files are uuid-prefixed, so we check suffix
            if fname.endswith(f"_{file_name}") or fname == file_name:
                return os.path.join(record_path, fname)
    return None
