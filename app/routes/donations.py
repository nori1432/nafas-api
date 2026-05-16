"""Donation routes: blood, organ, financial, tracking."""
from datetime import datetime, date, timedelta
from decimal import Decimal, InvalidOperation
from flask import Blueprint, request

from .. import db
from ..models.donation import (
    BloodCampaign, BloodDonation, OrganDonation, FinancialDonation, DonationTracking,
    CAMPAIGN_STATUS, FINANCIAL_PURPOSE, FINANCIAL_STATUS,
)
from ..models.hospital import Hospital
from ..models.user import BLOOD_TYPES
from ..utils.helpers import ok, fail, paginate, serialize_list, notify_role, push_notification, save_upload
from ..utils.decorators import jwt_user_required, role_required

bp = Blueprint("donations", __name__)


def _track(d_type: str, d_id: int, status: str, notes: str, user_id: int):
    db.session.add(DonationTracking(
        donation_type=d_type, donation_id=d_id,
        status_update=status, notes=notes, updated_by=user_id,
    ))


# ---------- BLOOD CAMPAIGNS ----------

@bp.get("/blood/campaigns")
def list_blood_campaigns():
    q = BloodCampaign.query.join(Hospital, BloodCampaign.hospital_id == Hospital.id)
    if (s := request.args.get("status")):
        q = q.filter(BloodCampaign.status == s)
    if (bt := request.args.get("blood_type")):
        # JSON LIKE search
        q = q.filter(db.func.json_search(BloodCampaign.blood_types_needed_json, "one", bt).isnot(None))
    if (w := request.args.get("wilaya")):
        q = q.filter(Hospital.wilaya_id == int(w))
    q = q.order_by(BloodCampaign.start_date.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/blood/campaigns")
@role_required("hospital_admin")
def create_campaign(current_user):
    data = request.get_json(silent=True) or {}
    required = ("hospital_id", "title_ar", "title_en", "blood_types_needed",
                "target_units", "start_date", "end_date")
    if any(data.get(k) in (None, "") for k in required):
        return fail("Missing fields", 422)
    if current_user.role == "hospital_admin" and int(data["hospital_id"]) != current_user.hospital_id:
        return fail("Forbidden", 403)
    try:
        sd = date.fromisoformat(data["start_date"])
        ed = date.fromisoformat(data["end_date"])
    except ValueError:
        return fail("Invalid date format", 422)
    if ed < sd:
        return fail("end_date before start_date", 422)
    types = data["blood_types_needed"]
    if not isinstance(types, list) or any(t not in BLOOD_TYPES for t in types):
        return fail("Invalid blood_types_needed", 422)
    c = BloodCampaign(
        hospital_id=int(data["hospital_id"]),
        title_ar=data["title_ar"],
        title_en=data["title_en"],
        blood_types_needed_json=types,
        target_units=int(data["target_units"]),
        start_date=sd, end_date=ed,
        created_by=current_user.id,
        status="active",
    )
    db.session.add(c)
    db.session.commit()
    return ok(c.to_dict(), "Campaign created", 201)


@bp.put("/blood/campaigns/<int:cid>")
@role_required("hospital_admin")
def update_campaign(cid, current_user):
    c = BloodCampaign.query.get_or_404(cid)
    if current_user.role == "hospital_admin" and c.hospital_id != current_user.hospital_id:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    for f in ("title_ar", "title_en", "target_units"):
        if f in data:
            setattr(c, f, data[f])
    if "blood_types_needed" in data:
        c.blood_types_needed_json = data["blood_types_needed"]
    if "status" in data:
        if data["status"] not in CAMPAIGN_STATUS:
            return fail("Invalid status", 422)
        c.status = data["status"]
    db.session.commit()
    return ok(c.to_dict(), "Updated")


@bp.post("/blood/donations")
@jwt_user_required
def register_blood_donation(current_user):
    data = request.get_json(silent=True) or {}

    # Resolve campaign first so we can derive hospital_id and date if not provided
    campaign = None
    if data.get("campaign_id"):
        campaign = BloodCampaign.query.get(int(data["campaign_id"]))
        if not campaign or campaign.status != "active":
            return fail("Campaign not active", 404)

    # hospital_id: explicit > from campaign
    hospital_id = data.get("hospital_id") or (campaign.hospital_id if campaign else None)
    if not hospital_id:
        return fail("hospital_id required", 422)

    # donation_date: explicit > today
    if data.get("donation_date"):
        try:
            dd = date.fromisoformat(data["donation_date"])
        except ValueError:
            return fail("Invalid donation_date", 422)
    else:
        dd = date.today()

    blood_type = data.get("blood_type") or current_user.blood_type
    if not blood_type or blood_type not in BLOOD_TYPES:
        return fail("Valid blood_type required (set your blood type in profile)", 422)

    if campaign and (campaign.blood_types_needed_json or []):
        if blood_type not in campaign.blood_types_needed_json:
            return fail("Your blood type is not needed for this campaign", 422)

    # 56-day cooldown
    last = BloodDonation.query.filter_by(donor_id=current_user.id, status="completed").order_by(
        BloodDonation.donation_date.desc()
    ).first()
    if last and (dd - last.donation_date).days < 56:
        return fail("You must wait at least 56 days between donations", 422)

    d = BloodDonation(
        donor_id=current_user.id,
        campaign_id=campaign.id if campaign else None,
        blood_type=blood_type,
        donation_date=dd,
        hospital_id=int(hospital_id),
        status="scheduled",
    )
    db.session.add(d)
    db.session.flush()
    _track("blood", d.id, "scheduled", f"Donation scheduled for {dd}", current_user.id)
    db.session.commit()
    return ok(d.to_dict(), "Registered", 201)


@bp.put("/blood/donations/<int:did>")
@role_required("hospital_admin")
def update_blood_donation(did, current_user):
    d = BloodDonation.query.get_or_404(did)
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("scheduled", "completed", "cancelled"):
        return fail("Invalid status", 422)
    d.status = new_status
    if new_status == "completed" and d.campaign_id:
        c = BloodCampaign.query.get(d.campaign_id)
        if c:
            c.collected_units = (c.collected_units or 0) + 1
            if c.target_units and c.collected_units >= c.target_units:
                c.status = "completed"
            elif c.target_units and c.collected_units >= int(c.target_units * 0.8):
                notify_role(
                    "national_admin",
                    title_ar="حملة دم وصلت 80%",
                    title_en="Blood campaign at 80% target",
                    body_ar=f"حملة {c.title_ar} وصلت إلى 80% من الهدف.",
                    body_en=f"Campaign {c.title_en} reached 80% of target.",
                    n_type="blood_campaign",
                    reference_id=c.id,
                )
    _track("blood", d.id, new_status, data.get("notes", ""), current_user.id)
    db.session.commit()
    return ok(d.to_dict(), "Updated")


@bp.get("/blood/donations/me")
@jwt_user_required
def my_blood_donations(current_user):
    q = BloodDonation.query.filter_by(donor_id=current_user.id).order_by(
        BloodDonation.donation_date.desc()
    )
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


# ---------- ORGAN DONATIONS ----------

@bp.post("/organ/register")
@bp.post("/organ")
@jwt_user_required
def organ_register(current_user):
    if request.content_type and request.content_type.startswith("multipart/"):
        organs = request.form.getlist("organs[]") or request.form.get("organs", "").split(",")
        organs = [o.strip() for o in organs if o.strip()]
        notes = request.form.get("notes")
        doc = save_upload(request.files.get("legal_document"), "organ_docs")
    else:
        data = request.get_json(silent=True) or {}
        organs = data.get("organs") or []
        notes = data.get("notes")
        doc = data.get("legal_document_url")
    if not organs:
        return fail("organs required", 422)

    o = OrganDonation(
        donor_id=current_user.id,
        organs_json=organs,
        legal_document_url=doc,
        notes=notes,
        status="registered",
    )
    db.session.add(o)
    db.session.flush()
    _track("organ", o.id, "registered", "Organ donation registered", current_user.id)
    db.session.commit()
    notify_role("national_admin",
                title_ar="تسجيل تبرع بالأعضاء",
                title_en="Organ donation registered",
                body_ar="يوجد تسجيل تبرع جديد بالأعضاء بحاجة للمراجعة.",
                body_en="A new organ donation registration awaits review.",
                n_type="organ", reference_id=o.id)
    return ok(o.to_dict(), "Registered", 201)


@bp.get("/organ/me")
@jwt_user_required
def my_organ_status(current_user):
    items = OrganDonation.query.filter_by(donor_id=current_user.id).order_by(
        OrganDonation.created_at.desc()
    ).all()
    return ok(serialize_list(items))


@bp.put("/organ/<int:oid>/review")
@role_required("national_admin")
def review_organ(oid, current_user):
    o = OrganDonation.query.get_or_404(oid)
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("under_review", "approved", "rejected"):
        return fail("Invalid status", 422)
    o.status = new_status
    o.reviewed_by = current_user.id
    if "notes" in data:
        o.notes = data["notes"]
    _track("organ", o.id, new_status, data.get("notes", ""), current_user.id)
    push_notification(
        o.donor_id,
        title_ar=f"تحديث تسجيل التبرع بالأعضاء: {new_status}",
        title_en=f"Organ donation status: {new_status}",
        body_ar=data.get("notes", ""),
        body_en=data.get("notes", ""),
        n_type="organ",
        reference_id=o.id,
    )
    db.session.commit()
    return ok(o.to_dict(), "Updated")


# ---------- FINANCIAL DONATIONS ----------

@bp.get("/financial/donations")
@jwt_user_required
def list_financial(current_user):
    q = FinancialDonation.query
    if current_user.role in ("citizen", "donor"):
        q = q.filter_by(donor_id=current_user.id)
    elif current_user.role == "hospital_admin" and current_user.hospital_id:
        q = q.filter_by(hospital_id=current_user.hospital_id)
    if (h := request.args.get("hospital_id")):
        q = q.filter_by(hospital_id=int(h))
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    q = q.order_by(FinancialDonation.donated_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/financial/donations")
@jwt_user_required
def submit_financial(current_user):
    data = request.get_json(silent=True) or {}
    if not data.get("hospital_id") or data.get("amount") in (None, ""):
        return fail("hospital_id and amount required", 422)
    try:
        amount = Decimal(str(data["amount"]))
    except (InvalidOperation, TypeError):
        return fail("Invalid amount", 422)
    if amount <= 0:
        return fail("Amount must be positive", 422)
    purpose = data.get("purpose", "general")
    if purpose not in FINANCIAL_PURPOSE:
        return fail("Invalid purpose", 422)
    f = FinancialDonation(
        donor_id=current_user.id,
        hospital_id=int(data["hospital_id"]),
        amount=amount,
        currency="DZD",
        purpose=purpose,
        target_equipment=data.get("target_equipment"),
        transaction_ref=data.get("transaction_ref"),
        status="pending",
    )
    db.session.add(f)
    db.session.flush()
    _track("financial", f.id, "pending", f"Donation of {amount} DZD submitted", current_user.id)
    notify_role(
        "hospital_admin",
        title_ar="تبرع مالي جديد",
        title_en="New financial donation",
        body_ar=f"تبرع بقيمة {amount} د.ج من {current_user.full_name}",
        body_en=f"Donation of {amount} DZD from {current_user.full_name}",
        n_type="financial",
        reference_id=f.id,
        hospital_id=f.hospital_id,
    )
    db.session.commit()
    return ok(f.to_dict(), "Donation submitted", 201)


@bp.put("/financial/donations/<int:fid>/confirm")
@role_required("hospital_admin")
def confirm_financial(fid, current_user):
    f = FinancialDonation.query.get_or_404(fid)
    if current_user.role == "hospital_admin" and f.hospital_id != current_user.hospital_id:
        return fail("Forbidden", 403)
    if f.status != "pending":
        return fail("Donation not in pending state", 422)
    f.status = "confirmed"
    f.confirmed_by = current_user.id
    f.confirmed_at = datetime.utcnow()
    _track("financial", f.id, "confirmed", "Receipt confirmed by hospital_admin", current_user.id)
    push_notification(
        f.donor_id,
        title_ar="تم تأكيد تبرعك المالي",
        title_en="Your donation was confirmed",
        body_ar=f"تم تأكيد استلام تبرعك بقيمة {f.amount} د.ج.",
        body_en=f"Your donation of {f.amount} DZD has been confirmed.",
        n_type="financial",
        reference_id=f.id,
    )
    db.session.commit()
    return ok(f.to_dict(), "Confirmed")


@bp.put("/financial/donations/<int:fid>/disburse")
@role_required("hospital_admin")
def disburse_financial(fid, current_user):
    f = FinancialDonation.query.get_or_404(fid)
    if current_user.role == "hospital_admin" and f.hospital_id != current_user.hospital_id:
        return fail("Forbidden", 403)
    if f.status != "confirmed":
        return fail("Donation must be confirmed first", 422)
    data = request.get_json(silent=True) or {}
    f.status = "disbursed"
    _track(
        "financial", f.id, "disbursed",
        data.get("notes", "Funds disbursed"), current_user.id,
    )
    db.session.commit()
    return ok(f.to_dict(), "Disbursed")


@bp.get("/financial/tracking")
@jwt_user_required
def financial_tracking(current_user):
    """Full audit trail of a single donation."""
    d_type = request.args.get("type", "financial")
    try:
        d_id = int(request.args.get("id"))
    except (TypeError, ValueError):
        return fail("id required", 422)
    items = DonationTracking.query.filter_by(donation_type=d_type, donation_id=d_id).order_by(
        DonationTracking.updated_at.asc()
    ).all()
    return ok(serialize_list(items))
