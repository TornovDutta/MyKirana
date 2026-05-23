import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import settings
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    content = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Image must be under {settings.max_upload_size_mb} MB")

    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()

    filename = f"{uuid.uuid4()}.{ext}"
    with open(os.path.join(settings.upload_dir, filename), "wb") as f:
        f.write(content)

    return {"url": f"/{settings.upload_dir}/{filename}"}
