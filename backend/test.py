from sqlalchemy import create_engine, text

def test_db_connection():
    # PostgreSQL 公网连接，启用 SSL 并忽略证书验证
    engine = create_engine(
        "postgresql+psycopg2://evin:19821027aA@121.36.193.222:5432/webdir",
        connect_args={
            "sslmode": "require"  # 等同于 Node.js ssl: { rejectUnauthorized: false }
        },
        echo=False  # True 可打印 SQL 日志
    )

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT NOW()"))
            print("✅ 数据库连接成功:", result.scalar())
    except Exception as e:
        print("❌ 数据库连接失败:", e)

if __name__ == "__main__":
    test_db_connection()
