from flask import Flask
from app.config import Config
from app.db_extensions import db, migrate
from app.models.picture import Picture
from app.models.shop import Shop
from app.models.shop_picture import ShopPicture

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes.upload import upload_bp
    from app.routes.test import test_bp
    from app.routes.shop import shop_bp
    from app.routes.files import files_bp
    from app.routes.user import user_bp

    app.register_blueprint(upload_bp, url_prefix='/photo')
    app.register_blueprint(test_bp, url_prefix='/test')
    app.register_blueprint(shop_bp, url_prefix='/shop')
    app.register_blueprint(files_bp, url_prefix='/files')
    app.register_blueprint(user_bp, url_prefix='/user')

    return app
