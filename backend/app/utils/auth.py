from flask import request

from app.models.user import User


def get_auth_user(req=None):
    """
    Resolve current user from Bearer token.
    Backward compatible with callers that pass Flask request explicitly.
    """
    req_obj = req or request
    auth_header = req_obj.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    return User.verify_access_token(token)

