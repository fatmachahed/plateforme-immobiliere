from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.utils.auth import get_current_user
from app import models
import uuid, os

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}
MAX_SIZE    = 5 * 1024 * 1024  # 5 MB

# Magic bytes des formats autorisés (anti content-type spoofing)
MAGIC_BYTES = {
    b"\xff\xd8\xff": "jpg",
    b"\x89PNG":      "png",
    b"RIFF":         "webp",  # RIFF....WEBP
    b"WEBP":         "webp",
}

def _check_magic(data: bytes) -> bool:
    for magic in MAGIC_BYTES:
        if data[:len(magic)] == magic:
            return True
    # WEBP: RIFF????WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return True
    return False

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
        raise HTTPException(400, "Fichier trop volumineux (max 5 MB)")

    # Vérification du contenu réel (pas seulement l'extension)
    if not _check_magic(contents):
        raise HTTPException(400, "Contenu du fichier invalide")

    filename = f"{uuid.uuid4()}.{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/{filename}", "filename": filename}
