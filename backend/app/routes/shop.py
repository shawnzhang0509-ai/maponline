from flask import Blueprint, request, jsonify, current_app
from app.services.shop_service import ShopService

shop_bp = Blueprint('shop', __name__)
service = ShopService()

@shop_bp.route('/search', methods=['GET'])
def search():
    keyword = request.args.get('keyword', '').strip()
    results = service.search_shop(keyword)

    # ✅ 修改点：不再拼接 file_base_url，直接使用 pic.url (完整链接)
    data = [
        {
            "id": shop.id,
            "name": shop.name,
            "address": shop.address,
            "lat": shop.lat,
            "lng": shop.lng,
            "phone": shop.phone,
            "badge_text": shop.badge_text,
            "new_girls_last_15_days": shop.new_girls_last_15_days,
            "pictures": [{"id": pic.id, "url": pic.url} for pic in (shop.pictures or [])]
        }
        for shop in results
    ]

    return jsonify(data)

@shop_bp.route('/add', methods=['POST'])
def add_shop():
    data = request.form.to_dict() 
    files = request.files.getlist("pictures") 
    shop = service.add_shop(data=data, files=files)

    # ✅ 修改点：不再拼接 file_base_url
    shop_data = {
        "id": shop.id,
        "name": shop.name,
        "address": shop.address,
        "lat": float(shop.lat),
        "lng": float(shop.lng),
        "phone": shop.phone,
        "new_girls_last_15_days": shop.new_girls_last_15_days,
        "pictures": [{"id": pic.id, "url": pic.url} for pic in (shop.pictures or [])]
    }

    return jsonify(shop_data)

# ✅ 临时加一个测试路由
@shop_bp.route('/list')
def list_all():
    return jsonify({"shops": "This is a test endpoint"})

@shop_bp.route('/del', methods=['POST'])
def delete_shop():
    data = request.get_json() or {}
    shop_id = data.get('id')
    token = data.get('token')
    ADMIN_DELETE_TOKEN = current_app.config['ADMIN_DELETE_TOKEN']

    if token != ADMIN_DELETE_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    if not shop_id:
        return jsonify({"error": "Missing shop id"}), 400

    isDeleteSuccess = service.del_shop(shop_id)
    if isDeleteSuccess:
        return jsonify({"success": True, "id": shop_id})
    else:
        return jsonify({"success": False, "id": shop_id})

# ✅ 原有路由：支持通过 ID 更新
@shop_bp.route('/update/<int:shop_id>', methods=['POST'])
def update_shop(shop_id):
    try:
        data = request.form.to_dict()
        files = request.files.getlist("pictures")
        shop = service.update_shop(shop_id=shop_id, data=data, files=files)
        
        # ✅ 修改点：不再拼接 file_base_url
        shop_data = {
            "id": shop.id,
            "name": shop.name,
            "address": shop.address,
            "lat": float(shop.lat),
            "lng": float(shop.lng),
            "phone": shop.phone,
            "badge_text": shop.badge_text,
            "new_girls_last_15_days": shop.new_girls_last_15_days,
            "pictures": [
                {"id": pic.id, "url": pic.url}
                for pic in (shop.pictures or [])
            ]
        }
        return jsonify(shop_data)
    except Exception as e:
        current_app.logger.error(f"Update shop failed: {str(e)}")
        return jsonify({"error": "更新失败", "details": str(e)}), 500

# 🆕 新增路由：支持通过 店铺名称 更新
@shop_bp.route('/update/<path:shop_name>', methods=['POST'])
def update_shop_by_name(shop_name):
    try:
        clean_name = shop_name.strip()
        current_app.logger.info(f"尝试通过名称更新店铺：{clean_name}")

        # 👇 1. 统一获取文件和表单数据
        files = request.files.getlist("pictures")
        data = request.form.to_dict()

        # 👇 2. 打印调试日志
        current_app.logger.info(f"📂 收到文件数量：{len(files)}")
        if files:
            current_app.logger.info(f"📄 文件名列表：{[f.filename for f in files]}")
        else:
            current_app.logger.warning("⚠️ 警告：前端没有发送任何图片文件！")

        # 👇 3. 查找店铺
        all_shops = service.get_all_shops()
        target_shop = None
        
        # 精确匹配
        for s in all_shops:
            if s.name == clean_name:
                target_shop = s
                break
        
        # 忽略大小写匹配
        if not target_shop:
            for s in all_shops:
                if s.name.lower() == clean_name.lower():
                    target_shop = s
                    break

        if not target_shop:
            return jsonify({"error": f"未找到名为 '{clean_name}' 的店铺"}), 404

        current_app.logger.info(f"✅ 找到店铺 ID: {target_shop.id}, 准备更新...")

        # 👇 4. 调用 Service 更新
        updated_shop = service.update_shop(shop_id=target_shop.id, data=data, files=files)

        # 👇 5. 构造返回数据 (✅ 修改点：不再拼接 file_base_url)
        shop_data = {
            "id": updated_shop.id,
            "name": updated_shop.name,
            "address": updated_shop.address,
            "lat": float(updated_shop.lat),
            "lng": float(updated_shop.lng),
            "phone": updated_shop.phone,
            "badge_text": updated_shop.badge_text,
            "new_girls_last_15_days": updated_shop.new_girls_last_15_days,
            "pictures": [
                {"id": pic.id, "url": pic.url}
                for pic in (updated_shop.pictures or [])
            ]
        }
        return jsonify(shop_data)

    except Exception as e:
        current_app.logger.error(f"Update shop by name failed: {str(e)}", exc_info=True)
        return jsonify({"error": "更新失败", "details": str(e)}), 500

@shop_bp.route('/shops', methods=['GET'])
def get_all_shops():
    shops = service.get_all_shops()
    
    # ✅ 修改点：不再拼接 file_base_url
    data = [
        {
            "id": shop.id,
            "name": shop.name,
            "address": shop.address,
            "lat": shop.lat,
            "lng": shop.lng,
            "phone": shop.phone,
            "badge_text": shop.badge_text,
            "new_girls_last_15_days": shop.new_girls_last_15_days,
            "pictures": [
                {"id": pic.id, "url": pic.url}
                for pic in (shop.pictures or [])
            ]
        }
        for shop in shops
    ]
    
    return jsonify(data)