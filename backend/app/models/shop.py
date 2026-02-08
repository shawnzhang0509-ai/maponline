from flask_sqlalchemy import SQLAlchemy
from app.db_extensions import db

class Shop(db.Model):
    __tablename__ = 'shop'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text, nullable=False)
    lat = db.Column(db.Numeric(9, 6), nullable=False)
    lng = db.Column(db.Numeric(9, 6), nullable=False)
    phone = db.Column(db.String(20))
    badge_text = db.Column(db.String(20))
    new_girls_last_15_days = db.Column(db.Boolean, server_default='false')

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    # 关联图片
    pictures = db.relationship(
        'Picture',
        secondary='shop_picture',
        back_populates='shops'
    )
