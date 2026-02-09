# app/models/association.py
from app import db

shop_picture = db.Table(
    'shop_picture',
    db.Column('shop_id', db.Integer, db.ForeignKey('shop.id'), primary_key=True),
    db.Column('picture_id', db.Integer, db.ForeignKey('picture.id'), primary_key=True)
)