"""National admin routes."""
from datetime import datetime, timedelta, date as date_type
from flask import Blueprint, request
from flask_jwt_extended import create_access_token

from .. import db
from ..models.user import User, USER_ROLES
from ..models.hospital import Hospital, HospitalSpecialty, HOSPITAL_TYPES
from ..models.complaint import Complaint
from ..models.donation import BloodCampaign, FinancialDonation, BloodDonation
from ..models.equipment import MaintenanceReport
from ..models.company import (
    MaintenanceCompany, MaintenanceNeed, ServiceOffer,
    Subscription, SUB_PLAN, SUB_STATUS,
)
from ..utils.helpers import ok, fail, paginate, serialize_list
from ..utils.decorators import role_required

bp = Blueprint("admin", __name__)


@bp.get("/dashboard")
@role_required("national_admin")
def dashboard(current_user):
    from ..models.company import MaintenanceCompany, Subscription, MaintenanceNeed
    total_hospitals = Hospital.query.filter_by(is_active=True).count()
    total_beds = db.session.query(db.func.coalesce(db.func.sum(Hospital.total_beds), 0)).scalar()
    avail_beds = db.session.query(db.func.coalesce(db.func.sum(Hospital.available_beds), 0)).scalar()
    active_campaigns = BloodCampaign.query.filter_by(status="active").count()
    open_complaints = Complaint.query.filter(Complaint.status != "closed").count()
    active_subs = Subscription.query.filter_by(status="active").count()
    approved_companies = MaintenanceCompany.query.filter_by(is_approved=True, is_active=True).count()
    pending_companies = MaintenanceCompany.query.filter_by(is_approved=False, is_active=True).count()
    open_needs = MaintenanceNeed.query.filter(
        MaintenanceNeed.status.in_(("open", "reviewing"))
    ).count()
    monthly_revenue = db.session.query(
        db.func.coalesce(db.func.sum(Subscription.price_monthly), 0)
    ).filter_by(status="active").scalar()
    return ok({
        "total_hospitals": total_hospitals,
        "total_beds": int(total_beds),
        "available_beds": int(avail_beds),
        "active_blood_campaigns": active_campaigns,
        "open_complaints": open_complaints,
        "total_users": User.query.filter_by(is_active=True).count(),
        "active_subscriptions": active_subs,
        "approved_companies": approved_companies,
        "pending_companies": pending_companies,
        "open_maintenance_needs": open_needs,
        "monthly_revenue_dzd": float(monthly_revenue or 0),
    })


@bp.get("/users")
@role_required("national_admin")
def list_users(current_user):
    q = User.query
    if (r := request.args.get("role")):
        q = q.filter_by(role=r)
    if (w := request.args.get("wilaya")):
        q = q.filter_by(wilaya=w)
    if (v := request.args.get("verified")):
        q = q.filter_by(is_verified=(v.lower() == "true"))
    if (s := request.args.get("search")):
        q = q.filter(db.or_(User.full_name.like(f"%{s}%"), User.phone_number.like(f"%{s}%")))
    q = q.order_by(User.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.put("/users/<int:uid>")
@role_required("national_admin")
def update_user(uid, current_user):
    u = User.query.get_or_404(uid)
    data = request.get_json(silent=True) or {}
    if "role" in data:
        if data["role"] not in USER_ROLES:
            return fail("Invalid role", 422)
        u.role = data["role"]
    if "is_verified" in data:
        u.is_verified = bool(data["is_verified"])
    if "is_active" in data:
        u.is_active = bool(data["is_active"])
    if "hospital_id" in data:
        u.hospital_id = data["hospital_id"]
    db.session.commit()
    return ok(u.to_dict(), "User updated")


@bp.get("/hospitals")
@role_required("national_admin")
def admin_hospitals(current_user):
    q = Hospital.query.order_by(Hospital.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/hospitals")
@role_required("national_admin")
def admin_create_hospital(current_user):
    data = request.get_json(silent=True) or {}
    required = ("name_ar", "name_en", "wilaya_id", "type")
    if any(not data.get(k) for k in required):
        return fail("Missing fields", 422)
    if data["type"] not in HOSPITAL_TYPES:
        return fail("Invalid type", 422)
    h = Hospital(
        name_ar=data["name_ar"],
        name_en=data["name_en"],
        wilaya_id=int(data["wilaya_id"]),
        commune_id=data.get("commune_id"),
        address=data.get("address"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        phone=data.get("phone"),
        type=data["type"],
        total_beds=int(data.get("total_beds", 0)),
        available_beds=int(data.get("available_beds", 0)),
    )
    db.session.add(h)
    db.session.commit()
    return ok(h.to_dict(), "Hospital created", 201)


@bp.put("/hospitals/<int:hid>")
@role_required("national_admin")
def admin_update_hospital(hid, current_user):
    h = Hospital.query.get_or_404(hid)
    data = request.get_json(silent=True) or {}
    for f in ("name_ar", "name_en", "wilaya_id", "commune_id", "address",
              "latitude", "longitude", "phone", "type", "total_beds",
              "available_beds", "is_active"):
        if f in data:
            setattr(h, f, data[f])
    db.session.commit()
    return ok(h.to_dict(), "Updated")


@bp.delete("/hospitals/<int:hid>")
@role_required("national_admin")
def admin_delete_hospital(hid, current_user):
    h = Hospital.query.get_or_404(hid)
    h.is_active = False
    db.session.commit()
    return ok(message="Hospital deactivated")


@bp.get("/complaints")
@role_required("national_admin")
def admin_complaints(current_user):
    q = Complaint.query
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (h := request.args.get("hospital_id")):
        q = q.filter_by(hospital_id=int(h))
    if (c := request.args.get("category")):
        q = q.filter_by(category=c)
    q = q.order_by(Complaint.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/donations")
@role_required("national_admin")
def admin_donations(current_user):
    kind = request.args.get("type", "financial")
    if kind == "blood":
        q = BloodDonation.query
    elif kind == "campaign":
        q = BloodCampaign.query
    else:
        q = FinancialDonation.query
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/maintenance")
@role_required("national_admin")
def admin_maintenance(current_user):
    q = MaintenanceReport.query
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (sev := request.args.get("severity")):
        q = q.filter_by(severity=sev)
    q = q.order_by(MaintenanceReport.opened_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/reports/beds")
@role_required("national_admin")
def report_beds(current_user):
    rows = db.session.query(
        Hospital.wilaya_id,
        db.func.sum(Hospital.total_beds),
        db.func.sum(Hospital.available_beds),
        db.func.count(Hospital.id),
    ).filter(Hospital.is_active == True).group_by(Hospital.wilaya_id).all()  # noqa: E712
    return ok([
        {"wilaya_id": w, "total_beds": int(t or 0), "available_beds": int(a or 0), "hospital_count": int(c or 0)}
        for w, t, a, c in rows
    ])


@bp.get("/reports/donations")
@role_required("national_admin")
def report_donations(current_user):
    days = int(request.args.get("days", 30))
    since = datetime.utcnow() - timedelta(days=days)
    fin_total = db.session.query(db.func.coalesce(db.func.sum(FinancialDonation.amount), 0)).filter(
        FinancialDonation.donated_at >= since
    ).scalar()
    blood_total = BloodDonation.query.filter(
        BloodDonation.status == "completed",
        BloodDonation.donation_date >= since.date(),
    ).count()
    return ok({
        "since": since.isoformat(),
        "financial_total_dzd": float(fin_total or 0),
        "blood_units_collected": blood_total,
        "active_campaigns": BloodCampaign.query.filter_by(status="active").count(),
    })


# ── Maintenance Companies ─────────────────────────────────────────────────────

@bp.get("/companies")
@role_required("national_admin")
def admin_companies(current_user):
    q = MaintenanceCompany.query
    if (a := request.args.get("approved")):
        q = q.filter_by(is_approved=(a.lower() == "true"))
    if (s := request.args.get("search")):
        q = q.filter(MaintenanceCompany.company_name.like(f"%{s}%"))
    items, pag = paginate(q.order_by(MaintenanceCompany.created_at.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.put("/companies/<int:cid>")
@role_required("national_admin")
def admin_update_company(cid, current_user):
    c = MaintenanceCompany.query.get_or_404(cid)
    data = request.get_json(silent=True) or {}
    for f in ("is_approved", "is_active", "company_name", "description"):
        if f in data:
            setattr(c, f, data[f])
    db.session.commit()
    return ok(c.to_dict(), "Updated")


# ── Subscriptions ─────────────────────────────────────────────────────────────

@bp.get("/subscriptions")
@role_required("national_admin")
def admin_subscriptions(current_user):
    q = Subscription.query
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (p := request.args.get("plan")):
        q = q.filter_by(plan=p)
    items, pag = paginate(q.order_by(Subscription.created_at.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.post("/subscriptions")
@role_required("national_admin")
def admin_create_subscription(current_user):
    data = request.get_json(silent=True) or {}
    if not data.get("hospital_id") or not data.get("plan") or not data.get("start_date") or not data.get("end_date"):
        return fail("hospital_id, plan, start_date and end_date required", 422)
    if data["plan"] not in SUB_PLAN:
        return fail("Invalid plan", 422)
    # upsert
    existing = Subscription.query.filter_by(hospital_id=int(data["hospital_id"])).first()
    if existing:
        existing.plan = data["plan"]
        existing.status = data.get("status", "active")
        existing.price_monthly = float(data.get("price_monthly", 0))
        existing.start_date = date_type.fromisoformat(data["start_date"])
        existing.end_date = date_type.fromisoformat(data["end_date"])
        existing.notes = data.get("notes")
        db.session.commit()
        return ok(existing.to_dict(), "Subscription updated")
    sub = Subscription(
        hospital_id=int(data["hospital_id"]),
        plan=data["plan"],
        status=data.get("status", "active"),
        price_monthly=float(data.get("price_monthly", 0)),
        start_date=date_type.fromisoformat(data["start_date"]),
        end_date=date_type.fromisoformat(data["end_date"]),
        notes=data.get("notes"),
    )
    db.session.add(sub)
    db.session.commit()
    return ok(sub.to_dict(), "Subscription created", 201)


@bp.put("/subscriptions/<int:sid>")
@role_required("national_admin")
def admin_update_subscription(sid, current_user):
    sub = Subscription.query.get_or_404(sid)
    data = request.get_json(silent=True) or {}
    for f in ("plan", "status", "price_monthly", "notes"):
        if f in data:
            setattr(sub, f, data[f])
    if "start_date" in data:
        sub.start_date = date_type.fromisoformat(data["start_date"])
    if "end_date" in data:
        sub.end_date = date_type.fromisoformat(data["end_date"])
    db.session.commit()
    return ok(sub.to_dict(), "Updated")


# ── Account Management (create hospital_admin + maintenance_company accounts) ─

@bp.get("/accounts")
@role_required("national_admin")
def admin_accounts(current_user):
    """List hospital admins and company users."""
    q = User.query.filter(User.role.in_(("hospital_admin", "maintenance_company")))
    if (r := request.args.get("role")):
        q = q.filter_by(role=r)
    items, pag = paginate(q.order_by(User.created_at.desc()))
    result = []
    for u in items:
        d = u.to_dict()
        if u.role == "maintenance_company":
            comp = MaintenanceCompany.query.filter_by(user_id=u.id).first()
            d["company"] = comp.to_dict() if comp else None
        result.append(d)
    return ok(result, pagination=pag)


@bp.post("/accounts/hospital-admin")
@role_required("national_admin")
def create_hospital_admin(current_user):
    """Create a hospital_admin account and assign to a hospital."""
    data = request.get_json(silent=True) or {}
    required = ("full_name", "phone_number", "password", "hospital_id")
    if any(not data.get(k) for k in required):
        return fail(f"Missing required fields: {', '.join(required)}", 422)
    if User.query.filter_by(phone_number=data["phone_number"]).first():
        return fail("Phone number already registered", 409)
    h = Hospital.query.get(int(data["hospital_id"]))
    if not h:
        return fail("Hospital not found", 404)
    u = User(
        full_name=data["full_name"].strip(),
        phone_number=data["phone_number"].strip(),
        role="hospital_admin",
        hospital_id=h.id,
        wilaya=h.wilaya.name_ar if h.wilaya else None,
        is_verified=True,
        is_active=True,
    )
    u.set_password(data["password"])
    db.session.add(u)
    db.session.commit()
    return ok(u.to_dict(), "Hospital admin account created", 201)


@bp.post("/accounts/company")
@role_required("national_admin")
def create_company_account(current_user):
    """Create a maintenance_company user + company profile."""
    data = request.get_json(silent=True) or {}
    required = ("full_name", "phone_number", "password", "company_name")
    if any(not data.get(k) for k in required):
        return fail(f"Missing required fields: {', '.join(required)}", 422)
    if User.query.filter_by(phone_number=data["phone_number"]).first():
        return fail("Phone number already registered", 409)
    u = User(
        full_name=data["full_name"].strip(),
        phone_number=data["phone_number"].strip(),
        role="maintenance_company",
        is_verified=True,
        is_active=True,
    )
    u.set_password(data["password"])
    db.session.add(u)
    db.session.flush()  # get u.id
    c = MaintenanceCompany(
        user_id=u.id,
        company_name=data["company_name"].strip(),
        description=data.get("description"),
        services=data.get("services", []),
        certifications=data.get("certifications", []),
        contact_phone=data.get("contact_phone"),
        contact_email=data.get("contact_email"),
        is_approved=data.get("is_approved", False),
    )
    db.session.add(c)
    db.session.commit()
    return ok({"user": u.to_dict(), "company": c.to_dict()}, "Company account created", 201)

