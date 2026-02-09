# backend/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # 配置...
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///./dev.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FILES_FOLDER'] = './uploads'

    db.init_app(app)

    # 👇 关键：导入所有模型，确保它们被注册
    from app.models.shop import Shop
    from app.models.picture import Picture
    from app.models.association import ShopPicture  # ← 加这一行！

    # 注册蓝图
    from app.routes.shop import shop_bp
    app.register_blueprint(shop_bp, url_prefix='/api')

    return app