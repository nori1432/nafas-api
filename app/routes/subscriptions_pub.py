"""
Public subscription request endpoint.
No authentication required — organisations submit a join request.
"""
from flask import Blueprint, request, jsonify
from .. import db
from ..models.subscription_request import SubscriptionRequest

bp = Blueprint("subscriptions_pub", __name__)


def ok(data=None, msg="OK"):
    return jsonify({"success": True, "message": msg, "data": data})


def err(msg, status=400):
    return jsonify({"success": False, "message": msg, "data": None}), status


@bp.post("/subscriptions/request")
def create_subscription_request():
    data = request.get_json(silent=True) or {}

    org_type = data.get("org_type", "").strip()
    org_name = data.get("org_name", "").strip()
    wilaya = data.get("wilaya", "").strip()
    address = data.get("address", "").strip()
    contact_name = data.get("contact_name", "").strip()
    contact_phone = data.get("contact_phone", "").strip()
    contact_email = (data.get("contact_email") or "").strip() or None
    website = (data.get("website") or "").strip() or None
    description = (data.get("description") or "").strip() or None

    # Basic validation
    if org_type not in ("hospital", "maintenance_company"):
        return err("نوع الجهة غير صحيح")
    if not org_name:
        return err("اسم الجهة مطلوب")
    if not wilaya:
        return err("الولاية مطلوبة")
    if not address:
        return err("العنوان مطلوب")
    if not contact_name:
        return err("اسم المسؤول مطلوب")
    if not contact_phone:
        return err("رقم الهاتف مطلوب")

    req = SubscriptionRequest(
        org_type=org_type,
        org_name=org_name,
        wilaya=wilaya,
        address=address,
        contact_name=contact_name,
        contact_phone=contact_phone,
        contact_email=contact_email,
        website=website,
        description=description,
        status="pending",
    )
    db.session.add(req)
    db.session.commit()

    return ok({"id": req.id}, "تم إرسال الطلب بنجاح"), 201
