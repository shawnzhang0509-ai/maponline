import re
from flask import Blueprint, request, jsonify
from app.models.click_stat import ClickStat
from app.models.shop import Shop
from app import db
from datetime import datetime
from sqlalchemy import func, case

tracking_bp = Blueprint('tracking', __name__)


def _normalize_shop_id(raw_shop_id):
    """
    Normalize shop ID from payload/URL.
    Accepts values like: 12, "12", "shop_12", "shop-12".
    Returns int or None when invalid.
    """
    if raw_shop_id is None:
        return None

    if isinstance(raw_shop_id, int):
        return raw_shop_id

    raw = str(raw_shop_id).strip()
    if not raw:
        return None

    if raw.isdigit():
        return int(raw)

    match = re.match(r"^shop[_-]?(\d+)$", raw, re.IGNORECASE)
    if match:
        return int(match.group(1))

    return None

# ==========================================
# 1. 写入接口 (保持不变)
# ==========================================
@tracking_bp.route('/track/action', methods=['POST'])
def track_action():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        raw_shop_id = data.get('shop_id')
        shop_id = _normalize_shop_id(raw_shop_id)
        action_type = data.get('type')
        phone = data.get('phone')

        if not shop_id or not action_type:
            return jsonify({"error": "Missing required parameters"}), 400

        stat = ClickStat(
            shop_id=shop_id,
            action_type=action_type,
            count=1,
            created_at=datetime.utcnow()
        )

        db.session.add(stat)
        db.session.commit()

        return jsonify({"status": "success", "message": "Tracked", "shop_id": shop_id}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ==========================================
# 2. 单个店铺统计 (保持不变)
# ==========================================
@tracking_bp.route('/stats/<shop_id>', methods=['GET'])
def get_stats(shop_id):
    try:
        normalized_shop_id = _normalize_shop_id(shop_id)
        if normalized_shop_id is None:
            return jsonify({"error": "Invalid shop_id"}), 400

        records = ClickStat.query.filter_by(shop_id=normalized_shop_id).all()
        shop = Shop.query.get(normalized_shop_id)

        sms_count = sum(r.count for r in records if r.action_type == 'sms')
        call_count = sum(r.count for r in records if r.action_type == 'call')

        return jsonify({
            "shop_id": normalized_shop_id,
            "shop_name": shop.name if shop else "Unknown Shop Name",
            "sms": sms_count,
            "call": call_count,
            "total": sms_count + call_count
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 3. 全局统计 (新增！给 Admin 页面用的)
# ==========================================
@tracking_bp.route('/stats/all', methods=['GET'])
def get_all_stats():
    """
    获取所有店铺的统计数据
    使用 SQL GROUP BY 进行聚合，效率最高
    """
    try:
        results = db.session.query(
            ClickStat.shop_id,
            Shop.name.label('shop_name'),
            func.sum(case((ClickStat.action_type == 'sms', ClickStat.count), else_=0)).label('sms'),
            func.sum(case((ClickStat.action_type == 'call', ClickStat.count), else_=0)).label('call'),
            func.sum(ClickStat.count).label('total')
        ).outerjoin(
            Shop, Shop.id == ClickStat.shop_id
        ).group_by(
            ClickStat.shop_id, Shop.name
        ).order_by(
            func.sum(ClickStat.count).desc()
        ).all()

        json_results = []
        for row in results:
            json_results.append({
                "shop_id": row.shop_id,
                "shop_name": row.shop_name or "Unknown Shop Name",
                "sms": row.sms or 0,
                "call": row.call or 0,
                "total": row.total or 0
            })

        return jsonify(json_results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500