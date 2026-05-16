"""Maintenance company portal – profile, browse needs, submit/manage offers."""
from flask import Blueprint, request

from .. import db
from ..models.company import (
    MaintenanceCompany, MaintenanceNeed, ServiceOffer,
    NEED_URGENCY, OFFER_STATUS,
)
from ..utils.helpers import ok, fail, paginate, serialize_list
from ..utils.decorators import role_required

bp = Blueprint("companies", __name__)


def _my_company(current_user):
    return MaintenanceCompany.query.filter_by(user_id=current_user.id).first()


# ── Dashboard ─────────────────────────────────────────────────────────────────

@bp.get("/dashboard")
@role_required("maintenance_company")
def company_dashboard(current_user):
    c = _my_company(current_user)
    if not c:
        return fail("Company profile not found", 404)
    pending   = ServiceOffer.query.filter_by(company_id=c.id, status="pending").count()
    accepted  = ServiceOffer.query.filter_by(company_id=c.id, status="accepted").count()
    completed = ServiceOffer.query.filter_by(company_id=c.id, status="completed").count()
    open_market = MaintenanceNeed.query.filter(
        MaintenanceNeed.status.in_(("open", "reviewing"))
    ).count()
    recent_offers = ServiceOffer.query.filter_by(company_id=c.id).order_by(
        ServiceOffer.created_at.desc()
    ).limit(5).all()
    return ok({
        "company": c.to_dict(),
        "pending_offers": pending,
        "accepted_offers": accepted,
        "completed_jobs": completed,
        "open_needs_market": open_market,
        "recent_offers": serialize_list(recent_offers),
    })


# ── Profile / Portfolio ───────────────────────────────────────────────────────

@bp.get("/profile")
@role_required("maintenance_company")
def company_profile(current_user):
    c = _my_company(current_user)
    if not c:
        return fail("Company profile not found", 404)
    return ok(c.to_dict())


@bp.put("/profile")
@role_required("maintenance_company")
def update_profile(current_user):
    c = _my_company(current_user)
    if not c:
        return fail("Company profile not found", 404)
    data = request.get_json(silent=True) or {}
    updatable = (
        "company_name", "description", "services", "certifications",
        "contact_email", "contact_phone", "website", "logo_url",
        "founded_year", "employee_count", "coverage_wilayas",
    )
    for f in updatable:
        if f in data:
            setattr(c, f, data[f])
    db.session.commit()
    return ok(c.to_dict(), "Profile updated")


# ── Browse Open Needs ─────────────────────────────────────────────────────────

@bp.get("/needs")
@role_required("maintenance_company")
def browse_needs(current_user):
    q = MaintenanceNeed.query.filter(MaintenanceNeed.status.in_(("open", "reviewing")))
    if (u := request.args.get("urgency")):
        q = q.filter_by(urgency=u)
    if (h := request.args.get("hospital_id")):
        q = q.filter_by(hospital_id=int(h))
    items, pag = paginate(q.order_by(MaintenanceNeed.created_at.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.get("/needs/<int:nid>")
@role_required("maintenance_company")
def need_detail(nid, current_user):
    n = MaintenanceNeed.query.get_or_404(nid)
    if n.status not in ("open", "reviewing"):
        return fail("This need is no longer public", 404)
    c = _my_company(current_user)
    d = n.to_dict()
    # Show company's own offer if already submitted
    if c:
        my_offer = ServiceOffer.query.filter_by(need_id=nid, company_id=c.id).first()
        d["my_offer"] = my_offer.to_dict() if my_offer else None
    return ok(d)


# ── Submit / Manage Offers ────────────────────────────────────────────────────

@bp.post("/needs/<int:nid>/offers")
@role_required("maintenance_company")
def submit_offer(nid, current_user):
    c = _my_company(current_user)
    if not c:
        return fail("Company profile not found", 404)
    if not c.is_approved:
        return fail("Your company must be approved by the platform before submitting offers", 403)
    n = MaintenanceNeed.query.get_or_404(nid)
    if n.status not in ("open", "reviewing"):
        return fail("This need is no longer accepting offers", 422)
    existing = ServiceOffer.query.filter_by(need_id=nid, company_id=c.id).filter(
        ServiceOffer.status.in_(("pending", "accepted"))
    ).first()
    if existing:
        return fail("You already have an active offer for this need", 409)
    data = request.get_json(silent=True) or {}
    if not data.get("description") or data.get("price") is None or not data.get("duration_days"):
        return fail("description, price and duration_days are required", 422)
    offer = ServiceOffer(
        need_id=nid,
        company_id=c.id,
        description=data["description"],
        price=float(data["price"]),
        currency=data.get("currency", "DZD"),
        duration_days=int(data["duration_days"]),
        warranty_months=int(data.get("warranty_months", 0)),
        notes=data.get("notes"),
    )
    db.session.add(offer)
    if n.status == "open":
        n.status = "reviewing"
    db.session.commit()
    return ok(offer.to_dict(), "Offer submitted", 201)


@bp.get("/offers")
@role_required("maintenance_company")
def my_offers(current_user):
    c = _my_company(current_user)
    if not c:
        return fail("Company profile not found", 404)
    q = ServiceOffer.query.filter_by(company_id=c.id)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    items, pag = paginate(q.order_by(ServiceOffer.created_at.desc()))
    return ok(serialize_list(items), pagination=pag)


@bp.put("/offers/<int:oid>")
@role_required("maintenance_company")
def update_offer(oid, current_user):
    c = _my_company(current_user)
    if not c:
        return fail("Company profile not found", 404)
    offer = ServiceOffer.query.get_or_404(oid)
    if offer.company_id != c.id:
        return fail("Forbidden", 403)
    if offer.status not in ("pending",):
        return fail("Only pending offers can be edited or withdrawn", 422)
    data = request.get_json(silent=True) or {}
    if data.get("withdraw"):
        offer.status = "withdrawn"
    else:
        for f in ("description", "price", "duration_days", "warranty_months", "notes", "currency"):
            if f in data:
                setattr(offer, f, data[f])
    db.session.commit()
    return ok(offer.to_dict(), "Updated")
