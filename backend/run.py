from app import create_app, db
from app.models.shop import Shop
from flask_cors import CORS

# 1. 创建应用实例 (此时 app/__init__.py 中的 CORS 和 蓝图 已加载)
app = create_app()

# ⚠️ 注意：app/__init__.py 中已经配置过 CORS 了。
# 如果那里配置了白名单，这里就不需要再写 CORS(app)，否则可能覆盖白名单。
# 如果确定要全局开放开发环境，可以保留，但通常不需要。
# CORS(app) 

# --- 数据库初始化逻辑 (保持原样，非常棒) ---
with app.app_context():
    shop = Shop.query.first()
    if not shop:
        print("🌱 未检测到数据，创建初始数据...")
        shop = Shop(
            name="Relax",
            address="123 Queen Street, Auckland CBD, Auckland 1010",
            phone="09-123-4567",
            lat=-36.8485,
            lng=174.7633,
            badge_text="Verified Listing",
            new_girls_last_15_days=True,
            about_me="我们提供专业、放松的按摩服务，环境舒适，技师经验丰富。欢迎预约体验！",
            additional_price="周末及公共假期加收 $20"
        )
        db.session.add(shop)
        db.session.commit()
        print("✅ 数据创建成功！")
    else:
        # 补全旧数据字段
        updated = False
        if not shop.about_me:
            shop.about_me = "我们提供专业、放松的按摩服务，环境舒适，技师经验丰富。欢迎预约体验！"
            updated = True
        if not shop.additional_price:
            shop.additional_price = "周末及公共假期加收 $20"
            updated = True
        
        if updated:
            db.session.commit()
            print("✅ 数据已补全！")
        else:
            print("ℹ️ 数据检查完毕，一切正常。")

if __name__ == '__main__':
    print("🚀 服务器启动成功！")
    print("   - 监听地址：http://0.0.0.0:5000")
    print("   - 统计接口已就绪：POST /shop/track/action")
    print("   - 店铺列表接口：GET /shop/shops")
    
    # 启动服务
    app.run(host='0.0.0.0', debug=True, port=5000)