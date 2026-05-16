"""Authentication routes."""
from flask import Blueprint, request
from flask_jwt_extended import create_access_token

from .. import db
from ..models.user import User, USER_ROLES, BLOOD_TYPES
from ..utils.helpers import ok, fail
from ..utils.decorators import jwt_user_required

bp = Blueprint("auth", __name__)


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    required = ("full_name", "phone_number", "password", "role")
    missing = [k for k in required if not data.get(k)]
    if missing:
        return fail(f"Missing fields: {', '.join(missing)}", 422)

    role = data["role"]
    # Only citizens and donors can self-register; all staff/admin accounts are created by national_admin
    if role not in ("citizen", "donor"):
        return fail("Self-registration is only available for patients. Contact the platform to register as staff or a maintenance company.", 403)

    blood_type = data.get("blood_type")
    if blood_type and blood_type not in BLOOD_TYPES:
        return fail("Invalid blood type", 422)

    if User.query.filter_by(phone_number=data["phone_number"]).first():
        return fail("Phone number already registered", 409)

    # Accept either 'wilaya' (string) or 'wilaya_id' (int) from mobile app
    wilaya_val = data.get("wilaya") or (str(data["wilaya_id"]) if data.get("wilaya_id") else None)

    user = User(
        full_name=data["full_name"].strip(),
        phone_number=data["phone_number"].strip(),
        role=role,
        wilaya=wilaya_val,
        commune=data.get("commune"),
        blood_type=blood_type,
        license_document_url=data.get("license_document_url"),
    )
    user.set_password(data["password"])
    # Doctors/engineers must be verified by admin before is_verified
    user.is_verified = role in ("citizen", "donor")
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return ok({"access_token": token, "user": user.to_dict()}, "Registered", 201)


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    phone = data.get("phone_number")
    password = data.get("password")
    if not phone or not password:
        return fail("phone_number and password required", 422)
    user = User.query.filter_by(phone_number=phone).first()
    if not user or not user.check_password(password):
        return fail("Invalid credentials", 401)
    if not user.is_active:
        return fail("Account disabled", 403)
    token = create_access_token(identity=str(user.id))
    return ok({"access_token": token, "user": user.to_dict()}, "Logged in")


@bp.get("/me")
@jwt_user_required
def me(current_user):
    return ok(current_user.to_dict(include_sensitive=True))


@bp.put("/profile")
@jwt_user_required
def update_profile(current_user):
    data = request.get_json(silent=True) or {}
    for field in ("full_name", "wilaya", "commune", "profile_photo_url"):
        if field in data and data[field] is not None:
            setattr(current_user, field, data[field])
    if "blood_type" in data and data["blood_type"]:
        if data["blood_type"] not in BLOOD_TYPES:
            return fail("Invalid blood type", 422)
        current_user.blood_type = data["blood_type"]
    db.session.commit()
    return ok(current_user.to_dict(), "Profile updated")


@bp.put("/password")
@jwt_user_required
def change_password(current_user):
    data = request.get_json(silent=True) or {}
    old = data.get("old_password")
    new = data.get("new_password")
    if not old or not new:
        return fail("old_password and new_password required", 422)
    if not current_user.check_password(old):
        return fail("Old password incorrect", 401)
    if len(new) < 6:
        return fail("New password too short (min 6)", 422)
    current_user.set_password(new)
    db.session.commit()
    return ok(message="Password updated")
