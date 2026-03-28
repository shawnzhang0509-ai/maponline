import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # ... (前面的数据库配置代码保持不变) ...
    basedir_app = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.dirname(basedir_app) 
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print("✅ 已连接到 Render PostgreSQL 数据库")
    else:
        db_path = os.path.join(project_root, 'dev.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path.replace('\\', '/')
        print(f"⚠️ 未检测到 DATABASE_URL，正在使用本地 SQLite: {db_path}")

    app.config['ADMIN_DELETE_TOKEN'] = 'my_super_secret_delete_token'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    app.config['FILES_FOLDER'] = os.path.join(basedir_app, 'uploads') 
    
    if not os.path.exists(app.config['FILES_FOLDER']):
        os.makedirs(app.config['FILES_FOLDER'])

    db.init_app(app)
    CORS(app, origins=["https://www.nzmassagemap.online", "http://localhost:3000", "http://127.0.0.1:3000"])

    # ==========================================
    # 👇 修改点 1：导入新的 ClickStat 模型
    # ==========================================
    from app.models.shop import Shop
    from app.models.picture import Picture
    from app.models.association import ShopPicture
    from app.models.click_stat import ClickStat  # <--- 新增这一行

    # ==========================================
    # 👇 修改点 2：注册 tracking 蓝图
    # ==========================================
    from app.routes.shop import shop_bp
    from app.routes.user import user_bp
    from app.routes.tracking import tracking_bp  # <--- 新增导入

    app.register_blueprint(shop_bp, url_prefix='/shop')
    app.register_blueprint(user_bp)
    app.register_blueprint(tracking_bp, url_prefix='/tracking') # <--- 新增注册

    # ... (后面的文件服务和路由保持不变) ...
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