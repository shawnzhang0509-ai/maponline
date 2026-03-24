from flask import Blueprint, request, jsonify, current_app
from app.services.shop_service import ShopService
from urllib.parse import quote
from datetime import datetime

shop_bp = Blueprint('shop', __name__)
service = ShopService()

# ==========================================
# 📊 1. 【重要】把静态、具体的路由放在最前面！
# ==========================================

# 用一个全局字典暂存数据 (重启后清零)
click_stats = {} 

@shop_bp.route('/track/action', methods=['POST'])
def track_action():
    """
    通用追踪接口 (接收 POST JSON)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        shop_id = data.get('shop_id')
        action_type = data.get('type') 
        phone = data.get('phone')
        address = data.get('address', '')
        
        if not shop_id or not action_type or not phone:
            return jsonify({"error": "Missing required parameters"}), 400

        key = (str(shop_id), action_type)
        click_stats[key] = click_stats.get(key, 0) + 1
        
        now = datetime.now().strftime("%H:%M:%S")
        current_app.logger.info(f"📊 [{now}] Shop {shop_id} - {action_type.upper()} clicked! (Total: {click_stats[key]})")

        return jsonify({
            "status": "success", 
            "message": "Tracking recorded",
            "count": click_stats[key]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Tracking error: {str(e)}", exc_info=True)
        # 软失败：即使报错也返回 200，确保前端能继续跳转
        return jsonify({"status": "error", "message": str(e)}), 200 

@shop_bp.route('/stats', methods=['GET'])
def get_click_stats():
    data = []
    for (sid, atype), count in click_stats.items():
        data.append({"shop_id": sid, "type": atype, "count": count})
    return jsonify(data)

# ==========================================
# 🔍 2. 普通业务路由
# ==========================================

@shop_bp.route('/search', methods=['GET'])
def search():
    keyword = request.args.get('keyword', '').strip()
    results = service.search_shop(keyword)
    return jsonify([shop.to_dict() for shop in results])

@shop_bp.route('/add', methods=['POST'])
def add_shop():
    data = request.form.to_dict() 
    files = request.files.getlist("pictures") 
    shop = service.add_shop(data=data, files=files)
    return jsonify(shop.to_dict())

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

@shop_bp.route('/shops', methods=['GET'])
def get_all_shops():
    shops = service.get_all_shops()
    return jsonify([shop.to_dict() for shop in shops])

# ==========================================
# ⚠️ 3. 【最后】带动态参数 (<...>) 的路由放在最后
# ==========================================

@shop_bp.route('/update/<int:shop_id>', methods=['POST'])
def update_shop(shop_id):
    try:
        data = request.form.to_dict()
        files = request.files.getlist("pictures")
        shop = service.update_shop(shop_id=shop_id, data=data, files=files)
        return jsonify(shop.to_dict())
    except Exception as e:
        current_app.logger.error(f"Update shop failed: {str(e)}")
        return jsonify({"error": "更新失败", "details": str(e)}), 500

@shop_bp.route('/update/<path:shop_name>', methods=['POST'])
def update_shop_by_name(shop_name):
    try:
        clean_name = shop_name.strip()
        current_app.logger.info(f"尝试通过名称更新店铺：{clean_name}")

        files = request.files.getlist("pictures")
        data = request.form.to_dict()

        all_shops = service.get_all_shops()
        target_shop = None
        
        for s in all_shops:
            if s.name == clean_name:
                target_shop = s
                break
        
        if not target_shop:
            for s in all_shops:
                if s.name.lower() == clean_name.lower():
                    target_shop = s
                    break

        if not target_shop:
            return jsonify({"error": f"未找到名为 '{clean_name}' 的店铺"}), 404

        updated_shop = service.update_shop(shop_id=target_shop.id, data=data, files=files)
        return jsonify(updated_shop.to_dict())

    except Exception as e:
        current_app.logger.error(f"Update shop by name failed: {str(e)}", exc_info=True)
        return jsonify({"error": "更新失败", "details": str(e)}), 500