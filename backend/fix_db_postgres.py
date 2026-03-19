# fix_db_postgres.py
# 专门用于修复 Render 上的 PostgreSQL 数据库

from sqlalchemy import create_engine, text

# 👇👇👇 1. 在这里粘贴你的 Render External Database URL
# 格式: postgresql://user:password@host:port/dbname?sslmode=require
DB_URL = "postgresql://my_shop_db_dqoi_user:Bb2yN1Wt3QxxaXoXOBRdKyNaEBfyLGwQ@dpg-d6nsphfafjfc73am4vig-a.oregon-postgres.render.com/my_shop_db_dqoi"

if __name__ == "__main__":
    if "postgresql" not in DB_URL:
        print("❌ 错误：请确保填入的是 PostgreSQL 的连接 URL (以 postgresql:// 开头)")
        exit(1)

    print(f"🔗 正在连接远程数据库...")
    try:
        # 创建引擎
        engine = create_engine(DB_URL)
        
        with engine.connect() as conn:
            print("✅ 连接成功！正在执行修复...")
            
            # 执行 SQL
            conn.execute(text("ALTER TABLE shop ADD COLUMN IF NOT EXISTS about_me TEXT DEFAULT ''"))
            conn.execute(text("ALTER TABLE shop ADD COLUMN IF NOT EXISTS additional_price VARCHAR(255) DEFAULT ''"))
            
            conn.commit()
            
            print("\n🎉 成功！云端数据库已修复。")
            print("🚀 下一步：去 Render 后台重新部署 (Redeploy) 你的 Web Service。")
            
    except Exception as e:
        print(f"\n❌ 失败: {e}")
        print("💡 检查：1. URL是否正确  2. 网络是否通畅  3. 是否安装了 sqlalchemy (pip install sqlalchemy)")