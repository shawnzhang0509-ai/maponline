from flask import request

from app.models.user import User


def get_auth_user():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    return User.verify_access_token(token)

