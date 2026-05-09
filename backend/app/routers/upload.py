from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.utils.auth import get_current_user
from app import models
import uuid, os, shutil

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_SIZE    = 10 * 1024 * 1024  # 10 MB

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, "Format non supporté (jpg, png, webp)")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "Fichier trop volumineux (max 10 MB)")

    filename = f"{uuid.uuid4()}.{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/{filename}", "filename": filename}
