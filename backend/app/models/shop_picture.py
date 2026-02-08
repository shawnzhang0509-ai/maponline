from app.db_extensions import db

class ShopPicture(db.Model):
    __tablename__ = 'shop_picture'

    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shop.id'), nullable=False)
    picture_id = db.Column(db.Integer, db.ForeignKey('picture.id'), nullable=False)

    shop = db.relationship('Shop', backref='shop_pictures')
    picture = db.relationship('Picture', backref='shop_pictures')
