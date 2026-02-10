# backend/run.py
from app import create_app, db
from flask_cors import CORS

# 导入模型（用于测试数据）
from app.models.shop import Shop
from app.models.picture import Picture
from app.models.association import ShopPicture

app = create_app()
CORS(app, origins=[
    "https://nzmassagemap.online",
    "https://www.nzmassagemap.online",
    "https://maponline.vercel.app",  # Vercel 默认域名
    "http://localhost:3000"          # 本地开发
])
# 初始化数据库并添加测试数据
with app.app_context():
    db.create_all()  # 创建所有表（shop, picture, shop_picture）

    # 仅当没有店铺时，添加一个测试店铺
    # if Shop.query.count() == 0:
    #     print("🔍 数据库为空，正在添加测试店铺...")

    #     test_shop = Shop(
    #         name="阳光咖啡馆",
    #         address="北京市朝阳区建国路88号",
    #         phone="138-0013-8000",
    #         lat=39.9087,
    #         lng=116.4201,
    #         badge_text="新品推荐",
    #         new_girls_last_15_days=True
    #     )
    #     db.session.add(test_shop)
    #     db.session.commit()

    #     # 可选：添加一张测试图片（假设你有 static/test.jpg）
    #     # 如果不想处理文件，可以跳过图片部分
    #     test_pic = Picture(url="test.jpg")  # 注意：这个文件需真实存在
    #     db.session.add(test_pic)
    #     db.session.flush()  # 获取 picture.id

    #     # 建立关联
    #     assoc = ShopPicture(shop_id=test_shop.id, picture_id=test_pic.id)
    #     db.session.add(assoc)
    #     db.session.commit()

    #     print("✅ 测试店铺已添加！")

if __name__ == '__main__':
    print("🚀 启动 Flask 开发服务器...")
    print("🔗 访问 http://127.0.0.1:5000/api/shops 查看数据")
    app.run(host='0.0.0.0', port=5000, debug=True)