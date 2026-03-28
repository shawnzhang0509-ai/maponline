import psycopg2
import ssl

try:
    print("正在尝试连接...")
    
    # 1. 创建一个特殊的 SSL 上下文，允许不安全的连接（绕过旧版本库的兼容性问题）
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # 2. 把这个上下文传进去
    conn = psycopg2.connect(
        host="dpg-d6nsphfafjfc73am4vig-a.oregon-postgres.render.com", # ✅ 修正后的完整域名
        database="my_shop_db",
        user="my_shop_db_dqoi_user",
        password="Bb2yN1Wt3QxxaXoXOBRdKyNaEBfyLGwQ",
        sslmode="require",
        sslcontext=ctx  # ✅ 这里必须是 sslcontext (大写 C)
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM click_stats ORDER BY created_at DESC LIMIT 10;")
    rows = cursor.fetchall()
    
    print(f"✅ 成功！查到了 {len(rows)} 条数据：")
    for row in rows:
        print(row)

except Exception as e:
    print(f"❌ 报错：{e}")
    print("💡 如果还有报错，可能是网络问题，或者请尝试安装 DBeaver。")

finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()