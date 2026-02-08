from flask import send_from_directory, Blueprint

files_bp = Blueprint('files', __name__)

@files_bp.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('files', filename)
