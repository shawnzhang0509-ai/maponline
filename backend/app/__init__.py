import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # 👇 1. 获取当前文件 (__init__.py) 的绝对路径 -> backend/app
    basedir_app = os.path.abspath(os.path.dirname(__file__))
    
    # 👇 2. 【关键修改】获取项目根目录 (backend) -> 向上退一级 (os.path.dirname)
    # 这样无论 dev.db 放在 backend 目录下哪里，都能找到
    project_root = os.path.dirname(basedir_app) 
    
    # 👇 3. 智能判断数据库连接
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print("✅ 已连接到 Render PostgreSQL 数据库")
    else:
        # 👇 4. 【修复】强制指向 backend/dev.db
        # 路径拼接：project_root (backend) + dev.db
        db_path = os.path.join(project_root, 'dev.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path.replace('\\', '/')
        
        print(f"⚠️ 未检测到 DATABASE_URL，正在使用本地 SQLite: {db_path}")

    # 其他配置保持不变
    app.config['ADMIN_DELETE_TOKEN'] = 'my_super_secret_delete_token'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 上传文件夹配置 (也建议基于 project_root，防止路径混乱)
    # 假设 uploads 在 backend/app/uploads，保持原样即可；如果在 backend/uploads，则改用 project_root
    app.config['FILES_FOLDER'] = os.path.join(basedir_app, 'uploads') 
    
    if not os.path.exists(app.config['FILES_FOLDER']):
        os.makedirs(app.config['FILES_FOLDER'])
        print(f"📁 已创建上传目录: {app.config['FILES_FOLDER']}")

    db.init_app(app)
    CORS(app, origins=["https://www.nzmassagemap.online", "http://localhost:3000", "http://127.0.0.1:3000"])

    # 导入模型
    from app.models.shop import Shop
    from app.models.picture import Picture
    from app.models.association import ShopPicture

    # 注册蓝图
    from app.routes.shop import shop_bp
    from app.routes.user import user_bp

    app.register_blueprint(shop_bp, url_prefix='/shop')
    app.register_blueprint(user_bp)

    @app.route('/files/<path:filename>')
    def serve_files(filename):
        return send_from_directory(app.config['FILES_FOLDER'], filename)

    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        return send_from_directory(app.config['FILES_FOLDER'], filename)

    # 自动创建表结构
    with app.app_context():
        db.create_all()

    @app.route('/')
    def home():
        return "<h1>🎉 Welcome to NZ Massage Map!</h1><p>API is running.</p>"
        
    return app