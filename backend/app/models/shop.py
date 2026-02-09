# app/models/shop.py
from app import db
from app.models.picture import Picture
from app.models.association import shop_picture

class Shop(db.Model):
    __tablename__ = 'shop'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    badge_text = db.Column(db.String(50))                    # ← 补全
    new_girls_last_15_days = db.Column(db.Boolean, default=False)  # ← 补全

    pictures = db.relationship(
        "Picture",
        secondary=shop_picture,
        backref=db.backref("shops", lazy="dynamic")
    )