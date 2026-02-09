from flask import Blueprint, request, jsonify, current_app
from app.services.shop_service import ShopService
from flask import current_app

shop_bp = Blueprint('shop', __name__)
service = ShopService()

@shop_bp.route('/search', methods=['GET'])
def search():
    keyword = request.args.get('keyword', '').strip()

    results = service.search_shop(keyword)

    file_base_url = current_app.config['FILES_URL']
    
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
            "pictures": [{ "id": pic.id, "url": f"{file_base_url}{pic.url}"} for pic in (shop.pictures or [])]
            # "pictures": [
            #     f"{file_base_url}{pic.url}"
            #     for pic in (shop.pictures or [])
            # ]
        }
        for shop in results
    ]

    return jsonify(data)

@shop_bp.route('/add', methods=['POST'])
def add_shop():
    data = request.form.to_dict() 
    files = request.files.getlist("pictures") 
    shop = service.add_shop(data=data, files=files)

    file_base_url = current_app.config.get('FILES_URL', '/files/')
    shop_data = {
        "id": shop.id,
        "name": shop.name,
        "address": shop.address,
        "lat": float(shop.lat),
        "lng": float(shop.lng),
        "phone": shop.phone,
        "new_girls_last_15_days": shop.new_girls_last_15_days,
        "pictures": [{ "id": pic.id, "url": f"{file_base_url}{pic.url}"} for pic in (shop.pictures or [])]
        # "pictures": [
        #     f"{file_base_url}{pic.url}" for pic in (shop.pictures or [])
        # ]
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
    
@shop_bp.route('/update/<int:shop_id>', methods=['POST'])
def update_shop(shop_id):
    data = request.form.to_dict()
    files = request.files.getlist("pictures")

    shop = service.update_shop(shop_id=shop_id, data=data, files=files)

    file_base_url = current_app.config.get('FILES_URL', '/files/')
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
            {
                "id": pic.id,
                "url": f"{file_base_url}{pic.url}"
            }
            for pic in (shop.pictures or [])
        ]
    }

@shop_bp.route('/shops', methods=['GET'])
def get_all_shops():
    shops = service.get_all_shops()
    file_base_url = current_app.config.get('FILES_URL', '/files/')
    
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
                {"id": pic.id, "url": f"{file_base_url}{pic.url}"}
                for pic in (shop.pictures or [])
            ]
        }
        for shop in shops
    ]
    
    return jsonify(data)   
