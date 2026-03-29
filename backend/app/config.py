# backend/app/config.py

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # === 修改为 PostgreSQL 连接 ===
    # 格式：postgresql://用户名:密码@主机:端口/数据库名
    SQLALCHEMY_DATABASE_URI = 'postgresql://my_shop_db_dqoi_user:Bb2yN1Wt3QxxaXoXOBRdKyNaEBfyLGwQ@dpg-d6nsphfaffc73am4vig-a.oregon-postgres.render.com:5432/my_shop_db_dqoi'

    SQLALCHEMY_TRACK_MODIFICATIONS = False