# backend/app/models/shop.py
from app import db

class Shop(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    badge_text = db.Column(db.String(50))
    new_girls_last_15_days = db.Column(db.Boolean, default=False)

    # 关联图片 —— 关键在这里！
    pictures = db.relationship(
        'Picture',
        secondary='shop_picture',  # ✅ 表名字符串，不是变量！
        back_populates='shops'
    )