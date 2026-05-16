"""Hospital ratings."""
from flask import Blueprint, request

from .. import db
from ..models.complaint import HospitalRating
from ..models.hospital import Hospital
from ..utils.helpers import ok, fail, paginate, serialize_list
from ..utils.decorators import jwt_user_required

bp = Blueprint("ratings", __name__)


@bp.get("/hospitals/<int:hid>/ratings")
def list_ratings(hid):
    Hospital.query.get_or_404(hid)
    q = HospitalRating.query.filter_by(hospital_id=hid).order_by(HospitalRating.created_at.desc())
    items, pag = paginate(q)
    avg = db.session.query(db.func.avg(HospitalRating.score)).filter_by(hospital_id=hid).scalar()
    return ok(
        {
            "ratings": serialize_list(items),
            "avg_rating": round(float(avg), 2) if avg else 0,
            "count": pag["total"],
        },
        pagination=pag,
    )


@bp.post("/hospitals/<int:hid>/ratings")
@jwt_user_required
def rate_hospital(hid, current_user):
    Hospital.query.get_or_404(hid)
    data = request.get_json(silent=True) or {}
    try:
        score = int(data.get("score"))
    except (TypeError, ValueError):
        return fail("score (1-5) required", 422)
    if not (1 <= score <= 5):
        return fail("score must be 1..5", 422)
    existing = HospitalRating.query.filter_by(user_id=current_user.id, hospital_id=hid).first()
    if existing:
        existing.score = score
        existing.comment = data.get("comment", existing.comment)
        db.session.commit()
        return ok(existing.to_dict(), "Rating updated")
    r = HospitalRating(
        user_id=current_user.id,
        hospital_id=hid,
        score=score,
        comment=data.get("comment"),
    )
    db.session.add(r)
    db.session.commit()
    return ok(r.to_dict(), "Rating submitted", 201)
