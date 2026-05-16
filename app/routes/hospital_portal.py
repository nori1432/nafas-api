"""Hospital admin portal – all routes auto-scoped to current_user.hospital_id."""
from datetime import datetime, timedelta
from flask import Blueprint, request

from .. import db
from ..models.user import User
from ..models.hospital import Hospital, BedHistory
from ..models.appointment import Appointment
from ..models.equipment import Equipment, EQUIPMENT_STATUS
from ..models.company import MaintenanceNeed, ServiceOffer, NEED_URGENCY, NEED_STATUS
from ..models.complaint import Complaint
from ..utils.helpers import ok, fail, paginate, serialize_list
from ..utils.decorators import role_required

bp = Blueprint("hospital_portal", __name__)


def _hid(current_user):
    return current_user.hospital_id


# ── Dashboard ─────────────────────────────────────────────────────────────────

@bp.get("/dashboard")
@role_required("hospital_admin")
def hosp_dashboard(current_user):
    hid = _hid(current_user)
    if not hid:
        return fail("No hospital assigned to your account", 403)
    h = Hospital.query.get_or_404(hid)
    today = datetime.utcnow().date()
    appts_today = Appointment.query.filter_by(hospital_id=hid).filter(
        db.func.date(Appointment.date_time) == today
    ).count()
    staff_count = User.query.filter_by(hospital_id=hid, is_active=True).filter(
        User.role.in_(("doctor", "engineer"))
    ).count()
    open_complaints = Complaint.query.filter_by(hospital_id=hid).filter(
        Complaint.status != "closed"
    ).count()
    faulty_equip = Equipment.query.filter_by(hospital_id=hid).filter(
        Equipment.status.in_(("faulty", "under_repair"))
    ).count()
    open_needs = MaintenanceNeed.query.filter_by(hospital_id=hid).filter(
        MaintenanceNeed.status.in_(("open", "reviewing", "assigned", "in_progress"))
    ).count()
    recent_appts = Appointment.query.filter_by(hospital_id=hid).order_by(
        Appointment.date_time.desc()
    ).limit(5).all()
    return ok({
        "hospital": h.to_dict(),
        "appointments_today": appts_today,
        "staff_count": staff_count,
        "open_complaints": open_complaints,
        "faulty_equipment": faulty_equip,
        "open_maintenance_needs": open_needs,
        "recent_appointments": serialize_list(recent_appts),
    })


# ── Beds ──────────────────────────────────────────────────────────────────────

@bp.get("/beds")
@role_required("hospital_admin")
def hosp_beds(current_user):
    hid = _hid(current_user)
    h = Hospital.query.get_or_404(hid)
    history = BedHistory.query.filter_by(hospital_id=hid).order_by(
        BedHistory.created_at.desc()
    ).limit(30).all()
    return ok({
        "total_beds": h.total_beds,
        "available_beds": h.available_beds,
        "history": [r.to_dict() for r in history],
    })


@bp.put("/beds")
@role_required("hospital_admin")
def hosp_update_beds(current_user):
    hid = _hid(current_user)
    h = Hospital.query.get_or_404(hid)
    data = request.get_json(silent=True) or {}
    if "total_beds" in data:
        h.total_beds = int(data["total_beds"])
    if "available_beds" in data:
        h.available_beds = int(data["available_beds"])
    if h.available_beds > h.total_beds:
        return fail("Available beds cannot exceed total beds", 422)
    db.session.add(BedHistory(
        hospital_id=hid,
        available_beds=h.available_beds,
        total_beds=h.total_beds,
        changed_by=current_user.id,
    ))
    db.session.commit()
    return ok({"total_beds": h.total_beds, "available_beds": h.available_beds}, "Beds updated")


# ── Appointments ─────────────────────────────────────────────────────────────

@bp.get("/appointments")
@role_required("hospital_admin")
def hosp_appointments(current_user):
    hid = _hid(current_user)
    q = Appointment.query.filter_by(hospital_id=hid)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (d := request.args.get("date")):
        q = q.filter(db.func.date(Appointment.date_time) == d)
    items, pag = paginate(q.order_by(Appointment.date_time.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.put("/appointments/<int:aid>")
@role_required("hospital_admin")
def hosp_update_appointment(aid, current_user):
    hid = _hid(current_user)
    a = Appointment.query.get_or_404(aid)
    if a.hospital_id != hid:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        a.status = data["status"]
    if "notes" in data:
        a.notes = data["notes"]
    db.session.commit()
    return ok(a.to_dict(), "Updated")


# ── Staff ─────────────────────────────────────────────────────────────────────

@bp.get("/staff")
@role_required("hospital_admin")
def hosp_staff(current_user):
    hid = _hid(current_user)
    q = User.query.filter_by(hospital_id=hid).filter(
        User.role.in_(("doctor", "engineer"))
    )
    if (r := request.args.get("role")):
        q = q.filter_by(role=r)
    if (s := request.args.get("search")):
        q = q.filter(db.or_(
            User.full_name.like(f"%{s}%"),
            User.phone_number.like(f"%{s}%"),
        ))
    items, pag = paginate(q.order_by(User.full_name))
    return ok(serialize_list(items), pagination=pag)


@bp.put("/staff/<int:uid>")
@role_required("hospital_admin")
def hosp_update_staff(uid, current_user):
    hid = _hid(current_user)
    u = User.query.get_or_404(uid)
    if u.hospital_id != hid:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    if "is_active" in data:
        u.is_active = bool(data["is_active"])
    if "is_verified" in data:
        u.is_verified = bool(data["is_verified"])
    db.session.commit()
    return ok(u.to_dict(), "Updated")


# ── Equipment ─────────────────────────────────────────────────────────────────

@bp.get("/equipment")
@role_required("hospital_admin")
def hosp_equipment(current_user):
    hid = _hid(current_user)
    q = Equipment.query.filter_by(hospital_id=hid)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (c := request.args.get("category")):
        q = q.filter_by(category=c)
    items, pag = paginate(q.order_by(Equipment.created_at.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.post("/equipment")
@role_required("hospital_admin")
def hosp_add_equipment(current_user):
    hid = _hid(current_user)
    data = request.get_json(silent=True) or {}
    if not data.get("name_ar") or not data.get("name_en"):
        return fail("name_ar and name_en required", 422)
    status = data.get("status", "operational")
    if status not in EQUIPMENT_STATUS:
        return fail("Invalid status", 422)
    e = Equipment(
        hospital_id=hid,
        name_ar=data["name_ar"],
        name_en=data["name_en"],
        serial_number=data.get("serial_number"),
        category=data.get("category"),
        status=status,
    )
    db.session.add(e)
    db.session.commit()
    return ok(e.to_dict(), "Equipment added", 201)


@bp.put("/equipment/<int:eid>")
@role_required("hospital_admin")
def hosp_update_equipment(eid, current_user):
    hid = _hid(current_user)
    e = Equipment.query.get_or_404(eid)
    if e.hospital_id != hid:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    for f in ("name_ar", "name_en", "serial_number", "category", "status"):
        if f in data:
            setattr(e, f, data[f])
    db.session.commit()
    return ok(e.to_dict(), "Updated")


# ── Maintenance Needs ─────────────────────────────────────────────────────────

@bp.get("/needs")
@role_required("hospital_admin")
def hosp_needs(current_user):
    hid = _hid(current_user)
    q = MaintenanceNeed.query.filter_by(hospital_id=hid)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (u := request.args.get("urgency")):
        q = q.filter_by(urgency=u)
    items, pag = paginate(q.order_by(MaintenanceNeed.created_at.desc()))
    return ok(serialize_list(items, include_offers=True), pagination=pag)


@bp.post("/needs")
@role_required("hospital_admin")
def hosp_create_need(current_user):
    hid = _hid(current_user)
    data = request.get_json(silent=True) or {}
    if not data.get("title") or not data.get("description"):
        return fail("title and description required", 422)
    urgency = data.get("urgency", "medium")
    if urgency not in NEED_URGENCY:
        return fail("Invalid urgency", 422)
    from datetime import date as date_type
    deadline = None
    if data.get("deadline"):
        try:
            deadline = date_type.fromisoformat(data["deadline"])
        except ValueError:
            return fail("Invalid deadline date format (YYYY-MM-DD)", 422)
    n = MaintenanceNeed(
        hospital_id=hid,
        equipment_id=data.get("equipment_id"),
        title=data["title"],
        description=data["description"],
        urgency=urgency,
        budget_min=data.get("budget_min"),
        budget_max=data.get("budget_max"),
        deadline=deadline,
        created_by=current_user.id,
    )
    db.session.add(n)
    db.session.commit()
    return ok(n.to_dict(), "Maintenance need created", 201)


@bp.put("/needs/<int:nid>")
@role_required("hospital_admin")
def hosp_update_need(nid, current_user):
    hid = _hid(current_user)
    n = MaintenanceNeed.query.get_or_404(nid)
    if n.hospital_id != hid:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    for f in ("title", "description", "urgency", "status", "budget_min", "budget_max"):
        if f in data:
            setattr(n, f, data[f])
    db.session.commit()
    return ok(n.to_dict(include_offers=True), "Updated")


@bp.put("/needs/<int:nid>/offers/<int:oid>")
@role_required("hospital_admin")
def hosp_decide_offer(nid, oid, current_user):
    """Hospital admin accepts or rejects a service offer."""
    hid = _hid(current_user)
    n = MaintenanceNeed.query.get_or_404(nid)
    if n.hospital_id != hid:
        return fail("Forbidden", 403)
    offer = ServiceOffer.query.get_or_404(oid)
    if offer.need_id != nid:
        return fail("Offer does not belong to this need", 422)
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if action not in ("accept", "reject"):
        return fail("action must be 'accept' or 'reject'", 422)
    if offer.status != "pending":
        return fail("Only pending offers can be decided", 422)
    if action == "accept":
        offer.status = "accepted"
        n.status = "assigned"
        # Reject all other pending offers for this need
        for other in n.offers.filter(
            ServiceOffer.id != oid,
            ServiceOffer.status == "pending",
        ).all():
            other.status = "rejected"
    else:
        offer.status = "rejected"
    db.session.commit()
    return ok(offer.to_dict(), "Offer " + ("accepted" if action == "accept" else "rejected"))


# ── Complaints ────────────────────────────────────────────────────────────────

@bp.get("/complaints")
@role_required("hospital_admin")
def hosp_complaints(current_user):
    hid = _hid(current_user)
    q = Complaint.query.filter_by(hospital_id=hid)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    items, pag = paginate(q.order_by(Complaint.created_at.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.put("/complaints/<int:cid>")
@role_required("hospital_admin")
def hosp_update_complaint(cid, current_user):
    hid = _hid(current_user)
    c = Complaint.query.get_or_404(cid)
    if c.hospital_id != hid:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        c.status = data["status"]
    if "admin_response" in data:
        c.admin_response = data["admin_response"]
    db.session.commit()
    return ok(c.to_dict(), "Updated")


# ── Reports ───────────────────────────────────────────────────────────────────

@bp.get("/reports")
@role_required("hospital_admin")
def hosp_reports(current_user):
    hid = _hid(current_user)
    days = int(request.args.get("days", 30))
    since = datetime.utcnow() - timedelta(days=days)
    appts_by_status = db.session.query(
        Appointment.status, db.func.count(Appointment.id)
    ).filter_by(hospital_id=hid).filter(
        Appointment.date_time >= since
    ).group_by(Appointment.status).all()
    equip_by_status = db.session.query(
        Equipment.status, db.func.count(Equipment.id)
    ).filter_by(hospital_id=hid).group_by(Equipment.status).all()
    complaints_by_status = db.session.query(
        Complaint.status, db.func.count(Complaint.id)
    ).filter_by(hospital_id=hid).filter(
        Complaint.created_at >= since
    ).group_by(Complaint.status).all()
    needs_by_urgency = db.session.query(
        MaintenanceNeed.urgency, db.func.count(MaintenanceNeed.id)
    ).filter_by(hospital_id=hid).group_by(MaintenanceNeed.urgency).all()
    return ok({
        "appointments": [{"status": s, "count": c} for s, c in appts_by_status],
        "equipment":    [{"status": s, "count": c} for s, c in equip_by_status],
        "complaints":   [{"status": s, "count": c} for s, c in complaints_by_status],
        "needs_urgency": [{"urgency": u, "count": c} for u, c in needs_by_urgency],
    })
