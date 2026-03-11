import os
from flask import Flask, send_from_directory  # 👈 1. 导入 send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # 👇 2. 获取绝对路径基准 (基于当前文件 __init__.py 所在的目录)
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # 👇 3. 【修复】智能判断数据库连接 (保持原样)
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print("✅ 已连接到 Render PostgreSQL 数据库")
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'dev.db')
        print("⚠️ 未检测到 DATABASE_URL，使用本地 SQLite")

    # 其他配置
    app.config['ADMIN_DELETE_TOKEN'] = 'my_super_secret_delete_token'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 👇 4. 【修复】使用绝对路径配置上传文件夹
    # 假设 uploads 文件夹在 app/ 目录下 (即与 __init__.py 同级)
    # 如果 uploads 在项目根目录，则改为 os.path.join(basedir, '..', 'uploads')
    app.config['FILES_FOLDER'] = os.path.join(basedir, 'uploads') 
    
    # 确保文件夹存在 (防止报错)
    if not os.path.exists(app.config['FILES_FOLDER']):
        os.makedirs(app.config['FILES_FOLDER'])
        print(f"📁 已创建上传目录: {app.config['FILES_FOLDER']}")

    db.init_app(app)
    # ⚠️ 注意：如果你在本地开发，可能需要允许 localhost，这里只写了线上域名
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

    # 👇 5. 【核心修复】添加静态文件服务路由
    # 当浏览器访问 /uploads/filename.png 时，执行此函数
    @app.route('/files/<path:filename>')
    def serve_files(filename):
        return send_from_directory(app.config['FILES_FOLDER'], filename)

    # 路由 2: 兼容新上传或前端硬编码的 /uploads/xxx.png 路径
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename): # 👈 保持原名：serve_uploads
        return send_from_directory(app.config['FILES_FOLDER'], filename)
    # 自动创建表结构
    with app.app_context():
        db.create_all()

    @app.route('/')
    def home():
        return "<h1>🎉 Welcome to NZ Massage Map!</h1><p>API is running.</p>"
        
    return app