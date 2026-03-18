# backend/update_db.py
from app import create_app, db
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    # 检查 Shop 表是否有 about_me 列
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns('shop')]
    
    if 'about_me' not in columns:
        print("⚠️ 检测到数据库缺少 'about_me' 列，正在尝试添加...")
        try:
            # 注意：这种方法依赖于 SQLAlchemy 的 op 操作，如果是纯原生添加可能需要 raw SQL
            # 最简单的开发环境做法其实是直接删库重建 (方案A)，或者执行原生 SQL
            with db.engine.connect() as conn:
                # 针对 SQLite 的通用添加列语句
                conn.execute(db.text("ALTER TABLE shop ADD COLUMN about_me TEXT"))
                conn.commit()
            print("✅ 成功添加 'about_me' 列！")
        except Exception as e:
            print(f"❌ 自动添加失败: {e}")
            print("💡 建议：直接删除 site.db 文件并重启 run.py (开发环境最快方法)")
    else:
        print("✅ 数据库已包含 'about_me' 列，无需更新。")