from flask import Blueprint, request, jsonify, current_app
from flask import current_app

user_bp = Blueprint('user', __name__)

@user_bp.route('login', methods=['GET'])
def login():
    uname = request.args.get('uname', '').strip()
    pwd = request.args.get('uname', '').strip()
    is_valid = (uname == 'admin' and pwd == 'admin')

    return jsonify({
        "success": is_valid
    })
