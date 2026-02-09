# app/__init__.py
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FILES_FOLDER'] = os.path.join(app.root_path, 'uploads')
    app.config['FILES_URL'] = '/uploads'
    
    os.makedirs(app.config['FILES_FOLDER'], exist_ok=True)
    
    db.init_app(app)
    
    from app.routes.shop import shop_bp
    app.register_blueprint(shop_bp, url_prefix='/shop')
    
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['FILES_FOLDER'], filename)
    
    return app