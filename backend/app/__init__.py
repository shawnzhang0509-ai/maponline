import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # 👇 1. 获取基于目录的路径 (用于本地 SQLite 备用)
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # 👇 2. 【关键修改】智能判断数据库连接
    # 优先读取 Render 的环境变量 DATABASE_URL
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        # Render 的链接以 postgres:// 开头，SQLAlchemy 需要 postgresql://
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print("✅ 已连接到 Render PostgreSQL 数据库")
    else:
        # 如果没有环境变量，则回退到本地 SQLite (方便你在自己电脑上开发)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'dev.db')
        print("⚠️ 未检测到 DATABASE_URL，使用本地 SQLite")

    # 其他配置保持不变
    app.config['ADMIN_DELETE_TOKEN'] = 'my_super_secret_delete_token'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FILES_FOLDER'] = './uploads'

    db.init_app(app)
    CORS(app, origins=["https://www.nzmassagemap.online"])

    # 导入模型
    from app.models.shop import Shop
    from app.models.picture import Picture
    from app.models.association import ShopPicture

    # 注册蓝图
    from app.routes.shop import shop_bp
    from app.routes.user import user_bp

    app.register_blueprint(shop_bp, url_prefix='/shop')
    app.register_blueprint(user_bp)

    # 👇 3. 【重要】自动创建表结构
    # 在云端首次运行时，Postgres 是空的，需要自动建表
    with app.app_context():
        db.create_all()

    @app.route('/')
    def home():
        return "<h1>🎉 Welcome to NZ Massage Map!</h1><p>API is running. Try /shop or /user endpoints.</p>"
    return app