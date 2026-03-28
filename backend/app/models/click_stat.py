# app/models/click_stat.py
from app import db  # 确保这里导入的是 __init__.py 里定义的 db
from datetime import datetime

class ClickStat(db.Model):
    __tablename__ = 'click_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    count = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<ClickStat {self.shop_id} {self.action_type}>'