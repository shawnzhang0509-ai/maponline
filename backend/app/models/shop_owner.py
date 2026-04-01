from app import db


class ShopOwner(db.Model):
    __tablename__ = "shop_owner"

    shop_id = db.Column(db.Integer, db.ForeignKey("shop.id"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

