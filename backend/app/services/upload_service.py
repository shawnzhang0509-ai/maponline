import os
from werkzeug.utils import secure_filename
import uuid
from flask import current_app

def save_uploaded_file(file):
    # 安全文件名
    original_name = secure_filename(file.filename)

    # 后缀
    ext = original_name.rsplit('.', 1)[1].lower()

    # UUID 文件名，避免冲突
    new_filename = f"{uuid.uuid4().hex}.{ext}"

    upload_dir = current_app.config['FILES_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)

    full_path = os.path.join(upload_dir, new_filename)
    file.save(full_path)

    return new_filename, full_path

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

def allowed_file(filename: str) -> bool:
    return (
        '.' in filename and
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    )

