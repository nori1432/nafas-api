"""Notification routes."""
from flask import Blueprint

from .. import db
from ..models.notification import Notification
from ..utils.helpers import ok, fail, paginate, serialize_list
from ..utils.decorators import jwt_user_required

bp = Blueprint("notifications", __name__)


@bp.get("/notifications")
@jwt_user_required
def list_notifications(current_user):
    q = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.put("/notifications/<int:nid>/read")
@jwt_user_required
def mark_read(nid, current_user):
    n = Notification.query.filter_by(id=nid, user_id=current_user.id).first()
    if not n:
        return fail("Notification not found", 404)
    n.is_read = True
    db.session.commit()
    return ok(n.to_dict(), "Marked read")


@bp.put("/notifications/read-all")
@jwt_user_required
def mark_all_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return ok(message="All marked read")
