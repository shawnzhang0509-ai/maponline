# backend/app/__init__.py
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # 👈 如果还没加，建议加上（解决跨域）

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # 👇 2. 必须定义 basedir (获取当前文件所在的绝对路径)
    basedir = os.path.abspath(os.path.dirname(__file__))
    
    # 配置...
    app.config['ADMIN_DELETE_TOKEN'] = 'my_super_secret_delete_token'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'dev.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FILES_FOLDER'] = './uploads'

    db.init_app(app)
    CORS(app, origins=["https://www.nzmassagemap.online"])  # 👈 允许前端跨域请求（开发时必需）

    # 导入模型
    from app.models.shop import Shop
    from app.models.picture import Picture
    from app.models.association import ShopPicture

    # 注册蓝图 👇 关键修复在这里！
    from app.routes.shop import shop_bp
    from app.routes.user import user_bp  # ← 新增：导入 user_bp

    app.register_blueprint(shop_bp, url_prefix='/shop')
    app.register_blueprint(user_bp)      # ← 新增：注册 user_bp（无前缀）

    return app