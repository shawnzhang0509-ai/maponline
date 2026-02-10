from flask import Blueprint, request, jsonify

user_bp = Blueprint('user', __name__)

@user_bp.route('/login', methods=['GET'])
def login():
    uname = request.args.get('uname', '').strip()
    pwd = request.args.get('pwd', '').strip()  # ✅ 改为 'pwd'
    
    is_valid = (uname == 'admin' and pwd == 'admin')

    return jsonify({
        "success": is_valid
    })