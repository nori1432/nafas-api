"""Auth and role-based access decorators."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from ..models.user import User


def _current_user():
    uid = get_jwt_identity()
    if uid is None:
        return None
    try:
        return User.query.get(int(uid))
    except (ValueError, TypeError):
        return None


def jwt_user_required(fn):
    """Verify JWT and inject the User instance as keyword arg `current_user`."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = _current_user()
        if user is None:
            return jsonify({"success": False, "message": "User not found", "data": None}), 401
        if not user.is_active:
            return jsonify({"success": False, "message": "Account disabled", "data": None}), 403
        kwargs["current_user"] = user
        return fn(*args, **kwargs)
    return wrapper


def role_required(*roles):
    """Restrict route to users with one of the given roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = _current_user()
            if user is None:
                return jsonify({"success": False, "message": "User not found", "data": None}), 401
            if not user.is_active:
                return jsonify({"success": False, "message": "Account disabled", "data": None}), 403
            if user.role not in roles and user.role != "national_admin":
                return jsonify(
                    {"success": False, "message": "Forbidden: insufficient role", "data": None}
                ), 403
            kwargs["current_user"] = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator
