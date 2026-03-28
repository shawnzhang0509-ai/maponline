# app/routes/tracking.py
from flask import Blueprint, request, jsonify, current_app
from app.models.click_stat import ClickStat
from app import db
from datetime import datetime

tracking_bp = Blueprint('tracking', __name__)

@tracking_bp.route('/track/action', methods=['POST'])
def track_action():
    """
    新版追踪接口：写入 PostgreSQL 数据库
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        shop_id = data.get('shop_id')
        action_type = data.get('type') 
        phone = data.get('phone')
        
        if not shop_id or not action_type or not phone:
            return jsonify({"error": "Missing required parameters"}), 400

        # 写入数据库
        stat = ClickStat(
            shop_id=shop_id, 
            action_type=action_type, 
            count=1,
            created_at=datetime.utcnow()
        )
        db.session.add(stat)
        db.session.commit()

        # 生成统计 Key 用于返回（可选）
        key = f"{shop_id}:{action_type}"
        
        now = datetime.now().strftime("%H:%M:%S")
        current_app.logger.info(f"📊 [DB] Shop {shop_id} - {action_type.upper()} clicked! (Recorded in DB)")

        return jsonify({
            "status": "success", 
            "message": "Tracking recorded in DB",
            "count": "N/A"  # 数据库里是多条记录，这里不返回总数
        }), 200

    except Exception as e:
        current_app.logger.error(f"Tracking DB error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500