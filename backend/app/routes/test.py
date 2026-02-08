from flask import Blueprint, request, jsonify, current_app

test_bp = Blueprint('test', __name__)

@test_bp.route('', methods=['GET'])
def test():
    return """
    <html>
        <head>
            <style>
                .message {
                    font-size: 20px;
                    color: white;
                    background-color: #4CAF50;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    width: 300px;
                    margin: 50px auto;
                }
            </style>
        </head>
        <body>
            <div class="message">Hello, this is backend for play and test! (evin and shawn)</div>
        </body>
    </html>
    """