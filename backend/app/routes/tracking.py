# app/routes/tracking.py
from flask import Blueprint, request, jsonify, current_app
from app.models.click_stat import ClickStat
from app import db
from datetime import datetime

tracking_bp = Blueprint('tracking', __name__)

# ==========================================
# 1. 写入接口 (保持不变，负责记录点击)
# ==========================================
@tracking_bp.route('/track/action', methods=['POST'])
def track_action():
    """
    追踪点击动作：写入 PostgreSQL 数据库
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        shop_id = data.get('shop_id')
        action_type = data.get('type') 
        phone = data.get('phone')
        
        # 简单校验
        if not shop_id or not action_type:
            return jsonify({"error": "Missing required parameters (shop_id/type)"}), 400

        # 写入数据库
        stat = ClickStat(
            shop_id=shop_id, 
            action_type=action_type, 
            count=1,
            created_at=datetime.utcnow()
        )
        db.session.add(stat)
        db.session.commit()

        current_app.logger.info(f"📊 [DB] Saved: {shop_id} - {action_type}")

        return jsonify({
            "status": "success", 
            "message": "Tracking recorded in DB"
        }), 200

    except Exception as e:
        db.session.rollback() # 出错回滚
        current_app.logger.error(f"Tracking DB error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# 2. 统计接口 (新增！负责计算总数)
# ==========================================
@tracking_bp.route('/stats/<shop_id>', methods=['GET'])
def get_stats(shop_id):
    """
    获取指定店铺的统计总数
    逻辑：查询数据库 -> 分组求和 -> 返回 JSON
    """
    try:
        # 1. 从数据库查出该店铺的所有记录
        records = ClickStat.query.filter_by(shop_id=shop_id).all()
        
        # 2. 在内存中计算总和 (因为记录数通常不会大到离谱，这样写简单)
        sms_count = sum(r.count for r in records if r.action_type == 'sms')
        call_count = sum(r.count for r in records if r.action_type == 'call')
        
        return jsonify({
            "shop_id": shop_id,
            "sms": sms_count,
            "call": call_count,
            "total": sms_count + call_count
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Stats error: {str(e)}")
        return jsonify({"error": str(e)}), 500