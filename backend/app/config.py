# backend/app/config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    
    # === 只用 SQLite，永远不用 psycopg2 ===
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {}  # SQLite 不需要连接池

    # 文件夹
    FILES_FOLDER = os.path.join(BASE_DIR, 'files')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

    # 文件访问 URL（Render 会通过反向代理暴露 /files）
    RENDER_EXTERNAL_URL = os.environ.get('RENDER_EXTERNAL_URL', '')
    if RENDER_EXTERNAL_URL:
        FILES_URL = f"{RENDER_EXTERNAL_URL}/files/"
    else:
        FILES_URL = "/files/"  # 开发时用相对路径

    ADMIN_DELETE_TOKEN = os.environ.get('ADMIN_DELETE_TOKEN') or "my_super_secret_delete_token"