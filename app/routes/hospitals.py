"""Hospital, beds, specialties, search, and map routes."""
import math
from flask import Blueprint, request

from .. import db
from ..models.hospital import Hospital, HospitalSpecialty, BedHistory, HOSPITAL_TYPES
from ..models.complaint import HospitalRating, Complaint
from ..models.user import User
from ..utils.helpers import ok, fail, paginate, serialize_list, notify_role
from ..utils.decorators import role_required, jwt_user_required

bp = Blueprint("hospitals", __name__)


@bp.get("/hospitals")
def list_hospitals():
    q = Hospital.query.filter_by(is_active=True)
    if (w := request.args.get("wilaya")):
        q = q.filter(Hospital.wilaya_id == w)
    if (c := request.args.get("commune")):
        q = q.filter(Hospital.commune_id == c)
    if (t := request.args.get("type")):
        q = q.filter(Hospital.type == t)
    if (s := request.args.get("search")):
        like = f"%{s}%"
        q = q.filter(db.or_(Hospital.name_ar.like(like), Hospital.name_en.like(like)))
    q = q.order_by(Hospital.name_ar.asc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/hospitals/<int:hid>")
def get_hospital(hid):
    h = Hospital.query.get_or_404(hid)
    data = h.to_dict(include_specialties=True)
    # stats
    avg = db.session.query(db.func.avg(HospitalRating.score)).filter_by(hospital_id=hid).scalar()
    data["avg_rating"] = round(float(avg), 2) if avg else 0
    data["complaint_count"] = Complaint.query.filter_by(hospital_id=hid).count()
    return ok(data)


@bp.get("/hospitals/<int:hid>/beds")
def get_beds(hid):
    h = Hospital.query.get_or_404(hid)
    return ok(
        {
            "available_beds": h.available_beds,
            "total_beds": h.total_beds,
            "updated_at": h.updated_at.isoformat() if h.updated_at else None,
        }
    )


@bp.put("/hospitals/<int:hid>/beds")
@role_required("hospital_admin")
def update_beds(hid, current_user):
    h = Hospital.query.get_or_404(hid)
    if current_user.role == "hospital_admin" and current_user.hospital_id != h.id:
        return fail("You can only update your own hospital", 403)
    data = request.get_json(silent=True) or {}
    available = data.get("available_beds")
    total = data.get("total_beds", h.total_beds)
    if available is None:
        return fail("available_beds required", 422)
    try:
        available = int(available)
        total = int(total)
    except (TypeError, ValueError):
        return fail("Bed counts must be integers", 422)
    if total < 0 or available < 0:
        return fail("Bed counts cannot be negative", 422)
    if available > total:
        return fail("available_beds cannot exceed total_beds", 422)

    h.available_beds = available
    h.total_beds = total
    db.session.add(BedHistory(
        hospital_id=h.id, available_beds=available, total_beds=total,
        changed_by=current_user.id,
    ))
    db.session.commit()

    if available == 0:
        notify_role(
            "national_admin",
            title_ar="تنبيه: استنفاد الأسرة",
            title_en="Alert: hospital beds exhausted",
            body_ar=f"المستشفى {h.name_ar} ليس به أسرة متاحة.",
            body_en=f"Hospital {h.name_en} has zero available beds.",
            n_type="bed_alert",
            reference_id=h.id,
        )
    return ok(h.to_dict(), "Beds updated")


@bp.get("/hospitals/<int:hid>/specialties")
def list_specialties(hid):
    items = HospitalSpecialty.query.filter_by(hospital_id=hid).all()
    return ok(serialize_list(items))


@bp.post("/hospitals/<int:hid>/specialties")
@role_required("hospital_admin")
def add_specialty(hid, current_user):
    if current_user.role == "hospital_admin" and current_user.hospital_id != hid:
        return fail("Forbidden", 403)
    Hospital.query.get_or_404(hid)
    data = request.get_json(silent=True) or {}
    if not data.get("specialty_name_ar") or not data.get("specialty_name_en"):
        return fail("specialty_name_ar and specialty_name_en required", 422)
    s = HospitalSpecialty(
        hospital_id=hid,
        specialty_name_ar=data["specialty_name_ar"],
        specialty_name_en=data["specialty_name_en"],
        doctor_count=int(data.get("doctor_count", 0)),
        is_available=bool(data.get("is_available", True)),
    )
    db.session.add(s)
    db.session.commit()
    return ok(s.to_dict(), "Specialty added", 201)


@bp.get("/hospitals/search")
def hospitals_nearest():
    """Find hospitals nearest to a lat/lng using haversine."""
    try:
        lat = float(request.args.get("lat"))
        lng = float(request.args.get("lng"))
    except (TypeError, ValueError):
        return fail("lat and lng query params required", 422)
    radius = float(request.args.get("radius_km", 50))
    limit = int(request.args.get("limit", 20))

    rows = Hospital.query.filter_by(is_active=True).filter(
        Hospital.latitude.isnot(None), Hospital.longitude.isnot(None)
    ).all()
    out = []
    for h in rows:
        d = _haversine(lat, lng, h.latitude, h.longitude)
        if d <= radius:
            entry = h.to_dict()
            entry["distance_km"] = round(d, 2)
            out.append(entry)
    out.sort(key=lambda x: x["distance_km"])
    return ok(out[:limit])


@bp.get("/hospitals/map")
def hospitals_map():
    rows = Hospital.query.filter_by(is_active=True).filter(
        Hospital.latitude.isnot(None), Hospital.longitude.isnot(None)
    ).all()
    return ok([
        {
            "id": h.id,
            "name_ar": h.name_ar,
            "name_en": h.name_en,
            "lat": h.latitude,
            "lng": h.longitude,
            "available_beds": h.available_beds,
            "total_beds": h.total_beds,
            "type": h.type,
        }
        for h in rows
    ])


@bp.get("/hospitals/<int:hid>/stats")
def hospital_stats(hid):
    from ..models.hospital import HospitalSpecialty
    h = Hospital.query.get_or_404(hid)
    avg = db.session.query(db.func.avg(HospitalRating.score)).filter_by(hospital_id=hid).scalar()
    return ok({
        "avg_rating": round(float(avg), 2) if avg else 0,
        "complaint_count": Complaint.query.filter_by(hospital_id=hid).count(),
        "available_beds": h.available_beds,
        "total_beds": h.total_beds,
        "specialty_count": HospitalSpecialty.query.filter_by(hospital_id=hid).count(),
    })


@bp.get("/doctors")
@jwt_user_required
def list_doctors(current_user):
    """Return doctors, filtered by hospital_id and/or specialty."""
    q = User.query.filter_by(role="doctor", is_active=True)
    if (h := request.args.get("hospital_id")):
        q = q.filter_by(hospital_id=int(h))
    if (s := request.args.get("specialty")):
        q = q.filter_by(specialty=s)
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/doctors/<int:did>")
@jwt_user_required
def get_doctor(did, current_user):
    """Return single doctor profile."""
    doc = User.query.filter_by(id=did, role="doctor", is_active=True).first_or_404()
    return ok(doc.to_dict())


def _haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    p1 = math.radians(lat1); p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1); dl = math.radians(lng2 - lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))
