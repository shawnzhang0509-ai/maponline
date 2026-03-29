from flask import Blueprint, request, jsonify, current_app
from app.services.shop_service import ShopService
from urllib.parse import quote
from datetime import datetime
from app import db  # 确保 db 实例正确导入

shop_bp = Blueprint('shop', __name__)
service = ShopService()

class ClickStat(db.Model):
    __tablename__ = 'click_stats'
    __table_args__ = {'extend_existing': True}  # 解决表已存在冲突

    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.String(50), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@shop_bp.route('/track/action', methods=['POST'])
def track_action():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        shop_id = data.get('shop_id')
        action_type = data.get('type')
        phone = data.get('phone')

        if not shop_id or not action_type or not phone:
            return jsonify({"error": "Missing required parameters"}), 400

        # 查询或创建记录
        record = ClickStat.query.filter_by(
            shop_id=shop_id,
            action_type=action_type
        ).first()

        if not record:
            record = ClickStat(
                shop_id=shop_id,
                action_type=action_type,
                count=1
            )
            db.session.add(record)
        else:
            record.count += 1
            db.session.add(record)

        db.session.commit()

        now = datetime.now().strftime("%H:%M:%S")
        current_app.logger.info(f"📊 [{now}] Shop {shop_id} - {action_type.upper()} clicked! (Total: {record.count})")

        return jsonify({
            "status": "success",
            "message": "Tracking recorded",
            "count": record.count
        }), 200

    except Exception as e:
        current_app.logger.error(f"Tracking error: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 200

@shop_bp.route('/stats', methods=['GET'])
def get_click_stats():
    try:
        records = ClickStat.query.all()
        data = [
            {
                "shop_id": r.shop_id,
                "type": r.action_type,
                "count": r.count,
                "created_at": r.created_at
            } for r in records
        ]
        return jsonify(data), 200
    except Exception as e:
        current_app.logger.error(f"Stats query error: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch stats"}), 500