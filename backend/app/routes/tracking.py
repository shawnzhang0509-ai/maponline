import re
from collections import defaultdict
from flask import Blueprint, request, jsonify
from app.models.click_stat import ClickStat
from app.models.shop import Shop
from app import db
from datetime import datetime
from sqlalchemy import func, cast, String

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


def _shop_id_candidates(normalized_shop_id):
    """
    Return all compatible shop_id representations used in legacy data.
    Example for 8: {"8", "shop_8", "shop-8"}.
    """
    if normalized_shop_id is None:
        return set()
    return {
        str(normalized_shop_id),
        f"shop_{normalized_shop_id}",
        f"shop-{normalized_shop_id}",
    }

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

        # Use cast(..., String) so query works whether DB column is int or text.
        candidates = _shop_id_candidates(normalized_shop_id)
        records = ClickStat.query.filter(
            cast(ClickStat.shop_id, String).in_(list(candidates))
        ).all()
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
        # Aggregate by raw stored value first, then merge in Python by normalized ID.
        # This avoids SQL type mismatch issues in legacy schemas (text vs int).
        grouped_rows = db.session.query(
            cast(ClickStat.shop_id, String).label("raw_shop_id"),
            ClickStat.action_type,
            func.sum(ClickStat.count).label("count")
        ).group_by(
            cast(ClickStat.shop_id, String),
            ClickStat.action_type
        ).all()

        aggregated = defaultdict(lambda: {"sms": 0, "call": 0, "total": 0})

        for row in grouped_rows:
            normalized = _normalize_shop_id(row.raw_shop_id)
            key = normalized if normalized is not None else row.raw_shop_id
            count = int(row.count or 0)

            if row.action_type == "sms":
                aggregated[key]["sms"] += count
            elif row.action_type == "call":
                aggregated[key]["call"] += count
            aggregated[key]["total"] += count

        numeric_shop_ids = [k for k in aggregated.keys() if isinstance(k, int)]
        shop_name_map = {}
        if numeric_shop_ids:
            shops = Shop.query.filter(Shop.id.in_(numeric_shop_ids)).all()
            shop_name_map = {shop.id: shop.name for shop in shops}

        json_results = []
        for key, metrics in aggregated.items():
            shop_id_value = key
            shop_name_value = (
                shop_name_map.get(key, "Unknown Shop Name")
                if isinstance(key, int)
                else "Unknown Shop Name"
            )
            json_results.append({
                "shop_id": shop_id_value,
                "shop_name": shop_name_value,
                "sms": metrics["sms"],
                "call": metrics["call"],
                "total": metrics["total"]
            })

        json_results.sort(key=lambda item: item["total"], reverse=True)

        return jsonify(json_results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500