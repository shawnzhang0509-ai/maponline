import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    FILES_FOLDER = os.path.join(BASE_DIR, 'files') 
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 连接池配置（非常重要）
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,            # 常驻连接
        "max_overflow": 20,         # 高峰临时连接
        "pool_timeout": 30,         # 等待连接秒数
        "pool_recycle": 1800,       # 防止 PG 断连
        "pool_pre_ping": True,      # 生产必须
        "connect_args": {
            "sslmode": "require"    # 强制华为云公网 RDS 使用 SSL
        }
    }

    SQLALCHEMY_DATABASE_URI = (
        "postgresql+psycopg2://evin:19821027aA@121.36.193.222:5432/webdir"
    )

    IPADDRESS = '60.204.150.165'
    PORT = '5793'
    FILES_URL = f"http://{IPADDRESS}:{PORT}/files/"

    ADMIN_DELETE_TOKEN = "my_super_secret_delete_token"
    