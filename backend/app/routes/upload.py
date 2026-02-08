from flask import Blueprint, request, jsonify, current_app
from app.services.upload_service import save_uploaded_file, allowed_file

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/translate', methods=['GET'])
def test():
    return 'test'

@upload_bp.route('/translate', methods=['POST'])
def upload_file():
    # 1️⃣ 是否包含文件
    if 'file' not in request.files:
        return jsonify({
            'error': 'file field is required'
        }), 400

    file = request.files['file']

    # 2️⃣ 文件名是否为空
    if not file or file.filename == '':
        return jsonify({
            'error': 'empty file'
        }), 400

    # 3️⃣ 类型校验（双保险）
    if not allowed_file(file.filename):
        return jsonify({
            'error': 'unsupported file type'
        }), 400

    if not file.mimetype.startswith('image/'):
        return jsonify({
            'error': 'invalid mimetype'
        }), 400

    try:
        filename, path = save_uploaded_file(file)

        # TODO: 这里以后可以直接接 OCR / 翻译
        # result = translate_image(path)

        return jsonify({
            'message': 'upload success',
            'filename': filename,
            'path': path
        })

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({
            'error': 'internal server error'
        }), 500

