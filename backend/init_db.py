# init_db.py
from app import create_app, db

app = create_app()

with app.app_context():
    # 强制引用模型（触发注册）
    from app.models.shop import Shop
    from app.models.picture import Picture
    
    # 删除旧表（可选，但推荐）
    db.drop_all()
    
    # 创建新表
    db.create_all()
    
    print("✅ 数据库重建成功！")
    print("Shop 表字段:", [c.name for c in Shop.__table__.columns])