"""Complaint routes."""
from datetime import datetime
from flask import Blueprint, request

from .. import db
from ..models.complaint import Complaint, COMPLAINT_CATEGORY, COMPLAINT_STATUS
from ..models.user import User
from ..utils.helpers import ok, fail, paginate, serialize_list, notify_role, push_notification, save_upload
from ..utils.decorators import jwt_user_required, role_required

bp = Blueprint("complaints", __name__)


@bp.get("/complaints")
@jwt_user_required
def list_complaints(current_user):
    q = Complaint.query
    if current_user.role in ("citizen", "donor", "doctor", "engineer"):
        q = q.filter_by(submitted_by=current_user.id)
    elif current_user.role == "hospital_admin" and current_user.hospital_id:
        q = q.filter_by(hospital_id=current_user.hospital_id)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (cat := request.args.get("category")):
        q = q.filter_by(category=cat)
    q = q.order_by(Complaint.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/complaints")
@jwt_user_required
def create_complaint(current_user):
    if request.content_type and request.content_type.startswith("multipart/"):
        hospital_id = request.form.get("hospital_id")
        category = request.form.get("category")
        description = request.form.get("description")
        attach = save_upload(request.files.get("attachment"), "complaints")
    else:
        data = request.get_json(silent=True) or {}
        hospital_id = data.get("hospital_id")
        category = data.get("category")
        description = data.get("description")
        attach = data.get("attachment_url")

    if not hospital_id or not category or not description:
        return fail("hospital_id, category, description required", 422)
    if category not in COMPLAINT_CATEGORY:
        return fail("Invalid category", 422)

    # one active per hospital per user
    active = Complaint.query.filter_by(
        submitted_by=current_user.id, hospital_id=int(hospital_id)
    ).filter(Complaint.status != "closed").first()
    if active:
        return fail("You already have an active complaint for this hospital", 409)

    # Auto-assign to a hospital_admin of that hospital, if any
    admin = User.query.filter_by(role="hospital_admin", hospital_id=int(hospital_id), is_active=True).first()

    c = Complaint(
        submitted_by=current_user.id,
        hospital_id=int(hospital_id),
        category=category,
        description=description,
        attachment_url=attach,
        status="open",
        assigned_to=admin.id if admin else None,
    )
    db.session.add(c)
    db.session.commit()

    notify_role(
        "hospital_admin",
        title_ar="شكوى جديدة",
        title_en="New complaint",
        body_ar=f"تم إرسال شكوى جديدة (التصنيف: {category}).",
        body_en=f"A new complaint has been submitted ({category}).",
        n_type="complaint",
        reference_id=c.id,
        hospital_id=int(hospital_id),
    )
    return ok(c.to_dict(), "Complaint submitted", 201)


@bp.put("/complaints/<int:cid>")
@role_required("hospital_admin")
def update_complaint(cid, current_user):
    c = Complaint.query.get_or_404(cid)
    if current_user.role == "hospital_admin" and c.hospital_id != current_user.hospital_id:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        if data["status"] not in COMPLAINT_STATUS:
            return fail("Invalid status", 422)
        c.status = data["status"]
        if data["status"] in ("resolved", "closed"):
            c.resolved_at = datetime.utcnow()
    if "response_notes" in data:
        c.response_notes = data["response_notes"]
    db.session.commit()
    push_notification(
        c.submitted_by,
        title_ar=f"تحديث شكواك: {c.status}",
        title_en=f"Complaint update: {c.status}",
        body_ar=c.response_notes or "",
        body_en=c.response_notes or "",
        n_type="complaint",
        reference_id=c.id,
    )
    return ok(c.to_dict(), "Updated")
