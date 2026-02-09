# backend/app/models/association.py
from app import db

class ShopPicture(db.Model):
    __tablename__ = 'shop_picture'
    
    shop_id = db.Column(db.Integer, db.ForeignKey('shop.id'), primary_key=True)
    picture_id = db.Column(db.Integer, db.ForeignKey('picture.id'), primary_key=True)

    # 如果以后想加字段（比如上传时间），可以在这里加
    # created_at = db.Column(db.DateTime, default=db.func.now())