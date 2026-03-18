from app import create_app, db
from app.models.shop import Shop

app = create_app()

# 只需要在启动时检查一次数据即可，不需要再手动改配置
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
        # 如果已有数据但字段为空，也可以在这里补全
        if not shop.about_me:
            shop.about_me = "我们提供专业、放松的按摩服务，环境舒适，技师经验丰富。欢迎预约体验！"
            shop.additional_price = "周末及公共假期加收 $20"
            db.session.commit()
            print("✅ 数据已补全！")
        else:
            print("ℹ️ 数据检查完毕，一切正常。")

if __name__ == '__main__':
    app.run(debug=True, port=5000)