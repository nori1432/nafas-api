"""Donation routes: blood, organ, financial, tracking."""
from datetime import date
from flask import Blueprint, request

from .. import db
from ..models.donation import (
    BloodCampaign, BloodDonation, DonationTracking,
    CAMPAIGN_STATUS,
)
from ..models.hospital import Hospital
from ..models.user import BLOOD_TYPES
from ..utils.helpers import ok, fail, paginate, serialize_list, notify_role, push_notification
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
