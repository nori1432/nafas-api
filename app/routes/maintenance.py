"""Maintenance, equipment and repair-center routes."""
from datetime import datetime
from flask import Blueprint, request

from .. import db
from ..models.equipment import (
    Equipment, MaintenanceReport, RepairCenter,
    EQUIPMENT_STATUS, MAINT_SEVERITY, MAINT_STATUS,
)
from ..utils.helpers import ok, fail, paginate, serialize_list, notify_role, push_notification
from ..utils.decorators import jwt_user_required, role_required

bp = Blueprint("maintenance", __name__)

# allowed forward transitions
_NEXT = {
    "open": {"assigned", "closed"},
    "assigned": {"in_progress", "closed"},
    "in_progress": {"resolved", "closed"},
    "resolved": {"closed"},
    "closed": set(),
}


# ---- Equipment ----

@bp.get("/equipment")
@jwt_user_required
def list_equipment(current_user):
    q = Equipment.query
    if (h := request.args.get("hospital_id")):
        q = q.filter_by(hospital_id=int(h))
    elif current_user.role == "hospital_admin" and current_user.hospital_id:
        q = q.filter_by(hospital_id=current_user.hospital_id)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (c := request.args.get("category")):
        q = q.filter_by(category=c)
    q = q.order_by(Equipment.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/equipment")
@role_required("hospital_admin")
def create_equipment(current_user):
    data = request.get_json(silent=True) or {}
    required = ("hospital_id", "name_ar", "name_en")
    if any(not data.get(k) for k in required):
        return fail("hospital_id, name_ar, name_en required", 422)
    if current_user.role == "hospital_admin" and int(data["hospital_id"]) != current_user.hospital_id:
        return fail("Forbidden", 403)
    e = Equipment(
        hospital_id=int(data["hospital_id"]),
        name_ar=data["name_ar"],
        name_en=data["name_en"],
        serial_number=data.get("serial_number"),
        category=data.get("category"),
        status=data.get("status", "operational"),
    )
    if e.status not in EQUIPMENT_STATUS:
        return fail("Invalid status", 422)
    db.session.add(e)
    db.session.commit()
    return ok(e.to_dict(), "Equipment added", 201)


@bp.put("/equipment/<int:eid>")
@role_required("hospital_admin")
def update_equipment(eid, current_user):
    e = Equipment.query.get_or_404(eid)
    if current_user.role == "hospital_admin" and e.hospital_id != current_user.hospital_id:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    for f in ("name_ar", "name_en", "serial_number", "category"):
        if f in data:
            setattr(e, f, data[f])
    if "status" in data:
        if data["status"] not in EQUIPMENT_STATUS:
            return fail("Invalid status", 422)
        e.status = data["status"]
    if "last_maintenance" in data and data["last_maintenance"]:
        e.last_maintenance = datetime.fromisoformat(data["last_maintenance"].replace("Z", "+00:00"))
    db.session.commit()
    return ok(e.to_dict(), "Equipment updated")


# ---- Maintenance reports ----

@bp.get("/maintenance")
@jwt_user_required
def list_maintenance(current_user):
    q = MaintenanceReport.query
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (h := request.args.get("hospital_id")):
        q = q.join(Equipment).filter(Equipment.hospital_id == int(h))
    elif current_user.role == "hospital_admin" and current_user.hospital_id:
        q = q.join(Equipment).filter(Equipment.hospital_id == current_user.hospital_id)
    elif current_user.role == "engineer":
        q = q.filter(db.or_(
            MaintenanceReport.reported_by == current_user.id,
            MaintenanceReport.assigned_to == current_user.id,
        ))
    q = q.order_by(MaintenanceReport.opened_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/maintenance")
@role_required("engineer", "hospital_admin", "citizen")
def create_maintenance(current_user):
    data = request.get_json(silent=True) or {}
    fault_desc = data.get("fault_description") or data.get("description")
    if not data.get("equipment_id") or not fault_desc:
        return fail("equipment_id and fault_description required", 422)
    eq = Equipment.query.get_or_404(int(data["equipment_id"]))
    severity = data.get("severity", "medium")
    if severity not in MAINT_SEVERITY:
        return fail("Invalid severity", 422)
    r = MaintenanceReport(
        equipment_id=eq.id,
        reported_by=current_user.id,
        fault_description=fault_desc,
        severity=severity,
        required_parts=data.get("required_parts"),
        repair_center_id=data.get("repair_center_id"),
        status="open",
    )
    eq.status = "faulty"
    db.session.add(r)
    db.session.commit()

    notify_role(
        "hospital_admin",
        title_ar="بلاغ صيانة جديد",
        title_en="New maintenance report",
        body_ar=f"تم بلاغ عطل في {eq.name_ar}",
        body_en=f"New fault report on {eq.name_en}",
        n_type="maintenance",
        reference_id=r.id,
        hospital_id=eq.hospital_id,
    )
    if severity == "critical":
        notify_role(
            "national_admin",
            title_ar="بلاغ حرج",
            title_en="Critical fault reported",
            body_ar=f"عطل حرج: {eq.name_ar}",
            body_en=f"Critical fault on {eq.name_en}",
            n_type="maintenance_critical",
            reference_id=r.id,
        )
    return ok(r.to_dict(), "Report submitted", 201)


@bp.get("/maintenance/<int:rid>")
@jwt_user_required
def get_maintenance(rid, current_user):
    r = MaintenanceReport.query.get_or_404(rid)
    return ok(r.to_dict())


@bp.put("/maintenance/<int:rid>")
@role_required("engineer", "hospital_admin")
def update_maintenance(rid, current_user):
    r = MaintenanceReport.query.get_or_404(rid)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        new = data["status"]
        if new not in MAINT_STATUS:
            return fail("Invalid status", 422)
        if new != r.status and new not in _NEXT.get(r.status, set()):
            return fail(f"Cannot transition {r.status} -> {new}", 422)
        r.status = new
        if new == "resolved":
            r.resolved_at = datetime.utcnow()
            if r.equipment:
                r.equipment.status = "operational"
                r.equipment.last_maintenance = datetime.utcnow()
            push_notification(
                r.reported_by,
                title_ar="تم حل العطل",
                title_en="Fault resolved",
                body_ar="تم حل العطل الذي قمت بالإبلاغ عنه.",
                body_en="The fault you reported has been resolved.",
                n_type="maintenance",
                reference_id=r.id,
            )
    if "assigned_to" in data:
        r.assigned_to = data["assigned_to"]
        if r.status == "open":
            r.status = "assigned"
    if "repair_center_id" in data:
        r.repair_center_id = data["repair_center_id"]
    if "resolution_notes" in data:
        r.resolution_notes = data["resolution_notes"]
    db.session.commit()
    return ok(r.to_dict(), "Updated")


# ---- Repair centers ----

@bp.get("/repair-centers")
@jwt_user_required
def list_repair_centers(current_user):
    q = RepairCenter.query
    if (w := request.args.get("wilaya")):
        q = q.filter_by(wilaya_id=int(w))
    if (t := request.args.get("type")):
        q = q.filter_by(type=t)
    if (s := request.args.get("scope")):
        q = q.filter_by(scope=s)
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/repair-centers")
@role_required("national_admin")
def create_repair_center(current_user):
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return fail("name required", 422)
    rc = RepairCenter(
        name=data["name"],
        type=data.get("type", "public"),
        scope=data.get("scope", "local"),
        wilaya_id=data.get("wilaya_id"),
        contact_phone=data.get("contact_phone"),
        contact_email=data.get("contact_email"),
        specialties_json=data.get("specialties") or [],
        is_approved=bool(data.get("is_approved", True)),
    )
    db.session.add(rc)
    db.session.commit()
    return ok(rc.to_dict(), "Repair center added", 201)
