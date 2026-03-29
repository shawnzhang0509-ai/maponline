from flask import Blueprint, request, jsonify, current_app
from app.models.click_stat import ClickStat
from app import db
from datetime import datetime
from sqlalchemy import func  # <--- 新增：用于 SQL 聚合计算

tracking_bp = Blueprint('tracking', __name__)

# ==========================================
# 1. 写入接口 (保持不变)
# ==========================================
@tracking_bp.route('/track/action', methods=['POST'])
def track_action():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        shop_id = data.get('shop_id')
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

        return jsonify({"status": "success", "message": "Tracked"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ==========================================
# 2. 单个店铺统计 (保持不变)
# ==========================================
@tracking_bp.route('/stats/<shop_id>', methods=['GET'])
def get_stats(shop_id):
    try:
        records = ClickStat.query.filter_by(shop_id=shop_id).all()
        
        sms_count = sum(r.count for r in records if r.action_type == 'sms')
        call_count = sum(r.count for r in records if r.action_type == 'call')
        
        return jsonify({
            "shop_id": shop_id,
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
        # 使用 SQLAlchemy 的 func 进行 SQL 级别的聚合查询
        # 相当于 SQL: SELECT shop_id, SUM(count) ... GROUP BY shop_id
        results = db.session.query(
            ClickStat.shop_id,
            func.sum(func.case((ClickStat.action_type == 'sms', 1))).label('sms'),
            func.sum(func.case((ClickStat.action_type == 'call', 1))).label('call'),
            func.sum(ClickStat.count).label('total')
        ).group_by(ClickStat.shop_id).order_by(func.sum(ClickStat.count).desc()).all()
        
        # 将结果转换为字典列表
        json_results = []
        for row in results:
            json_results.append({
                "shop_id": row.shop_id,
                "sms": row.sms or 0, # 防止是 None
                "call": row.call or 0,
                "total": row.total or 0
            })

        return jsonify(json_results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500