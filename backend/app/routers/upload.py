from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.utils.auth import get_current_user
from app import models
import uuid, os, io
from PIL import Image

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}
MAX_SIZE    = 5 * 1024 * 1024  # 5 MB

# Magic bytes des formats autorisés (anti content-type spoofing)
MAGIC_BYTES = {
    b"\xff\xd8\xff": "jpg",
    b"\x89PNG":      "png",
    b"RIFF":         "webp",
    b"WEBP":         "webp",
}

def _check_magic(data: bytes) -> bool:
    for magic in MAGIC_BYTES:
        if data[:len(magic)] == magic:
            return True
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return True
    return False

def _compress_image(contents: bytes, max_width: int = 1200, quality: int = 75) -> tuple[bytes, str]:
    """Redimensionne et compresse l'image en WebP."""
    img = Image.open(io.BytesIO(contents))

    # Convertir en RGB si nécessaire (PNG avec transparence → fond blanc)
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Redimensionner si trop large
    w, h = img.size
    if w > max_width:
        new_h = int(h * max_width / w)
        img = img.resize((max_width, new_h), Image.LANCZOS)

    # Sauvegarder en WebP
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=quality, method=6)
    return output.getvalue(), "webp"


router = APIRouter(prefix="/upload", tags=["Upload"])

CONV_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "convention")
os.makedirs(CONV_UPLOAD_DIR, exist_ok=True)

ALLOWED_CONV_EXT = {"jpg", "jpeg", "png", "pdf"}
MAX_CONV_SIZE    = 10 * 1024 * 1024  # 10 MB

@router.post("/convention-doc")
async def upload_convention_doc(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    ext = (file.filename or "doc").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_CONV_EXT:
        raise HTTPException(400, "Format non supporté (pdf, jpg, png)")
    contents = await file.read()
    if len(contents) > MAX_CONV_SIZE:
        raise HTTPException(400, "Fichier trop volumineux (max 10 MB)")
    filename = f"{uuid.uuid4()}.{ext}"
    dest = os.path.join(CONV_UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        f.write(contents)
    return {"url": f"/uploads/convention/{filename}", "filename": filename}


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

    if not _check_magic(contents):
        raise HTTPException(400, "Contenu du fichier invalide")

    # Compression + redimensionnement → WebP
    try:
        compressed, out_ext = _compress_image(contents)
    except Exception:
        # Si Pillow échoue, on sauvegarde l'original
        compressed, out_ext = contents, ext

    filename = f"{uuid.uuid4()}.{out_ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        f.write(compressed)

    return {"url": f"/uploads/{filename}", "filename": filename}
