from PIL import Image
import io

def compress_image(image_file, max_width=800, quality=70):
    img = Image.open(image_file)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img.thumbnail((max_width, max_width))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    return buffer
