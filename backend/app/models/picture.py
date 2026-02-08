from app.db_extensions import db

class Picture(db.Model):
    __tablename__ = 'picture'

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # 关联店铺
    shops = db.relationship(
        'Shop',
        secondary='shop_picture',
        back_populates='pictures'
    )
