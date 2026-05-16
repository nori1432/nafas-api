"""Medical records routes."""
from flask import Blueprint, request

from .. import db
from ..models.medical_record import MedicalRecord
from ..models.user import User
from ..utils.helpers import ok, fail, paginate, serialize_list
from ..utils.decorators import jwt_user_required, role_required

bp = Blueprint("records", __name__)


@bp.get("/records")
@jwt_user_required
def list_records(current_user):
    q = MedicalRecord.query
    if current_user.role == "doctor":
        q = q.filter_by(doctor_id=current_user.id)
    elif current_user.role in ("citizen", "donor"):
        q = q.filter_by(patient_id=current_user.id)
    elif current_user.role in ("hospital_admin", "national_admin"):
        if (h := request.args.get("hospital_id")):
            q = q.filter_by(hospital_id=int(h))
    else:
        return fail("Forbidden", 403)
    if (pid := request.args.get("patient_id")):
        q = q.filter_by(patient_id=int(pid))
    q = q.order_by(MedicalRecord.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/records")
@role_required("doctor")
def create_record(current_user):
    data = request.get_json(silent=True) or {}
    if not data.get("patient_id") or not data.get("diagnosis"):
        return fail("patient_id and diagnosis required", 422)
    patient = User.query.get(int(data["patient_id"]))
    if not patient:
        return fail("Patient not found", 404)
    r = MedicalRecord(
        patient_id=patient.id,
        doctor_id=current_user.id,
        hospital_id=data.get("hospital_id"),
        diagnosis=data["diagnosis"],
        prescription=data.get("prescription"),
        notes=data.get("notes"),
        attachments_json=data.get("attachments") or [],
    )
    db.session.add(r)
    db.session.commit()
    return ok(r.to_dict(), "Record created", 201)


@bp.get("/records/<int:rid>")
@jwt_user_required
def get_record(rid, current_user):
    r = MedicalRecord.query.get_or_404(rid)
    if current_user.role == "doctor" and r.doctor_id != current_user.id:
        return fail("Forbidden", 403)
    if current_user.role in ("citizen", "donor") and r.patient_id != current_user.id:
        return fail("Forbidden", 403)
    return ok(r.to_dict())


@bp.put("/records/<int:rid>")
@role_required("doctor")
def update_record(rid, current_user):
    r = MedicalRecord.query.get_or_404(rid)
    if r.doctor_id != current_user.id:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    for f in ("diagnosis", "prescription", "notes", "hospital_id"):
        if f in data:
            setattr(r, f, data[f])
    if "attachments" in data:
        r.attachments_json = data["attachments"]
    db.session.commit()
    return ok(r.to_dict(), "Record updated")
