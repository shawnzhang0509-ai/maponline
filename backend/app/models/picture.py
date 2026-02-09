from app import db

class Picture(db.Model):
    __tablename__ = 'picture'
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(200), nullable=False)
    # 不需要显式定义 relationship，因为 backref 已经在 Shop 中设置了