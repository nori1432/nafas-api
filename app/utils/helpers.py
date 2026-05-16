"""Helper utilities: response format, pagination, file uploads, notifications."""
import os
import uuid
from typing import Any, Iterable, Optional
from flask import jsonify, request, current_app
from werkzeug.utils import secure_filename

from .. import db
from ..models.notification import Notification


def ok(data: Any = None, message: str = "OK", status: int = 200, pagination: Optional[dict] = None):
    payload = {"success": True, "message": message, "data": data}
    if pagination is not None:
        payload["pagination"] = pagination
    return jsonify(payload), status


def fail(message: str = "Error", status: int = 400, data: Any = None):
    return jsonify({"success": False, "message": message, "data": data}), status


def paginate(query, default_per_page: int = 20, max_per_page: int = 100):
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = min(max_per_page, max(1, int(request.args.get("per_page", default_per_page))))
    except (TypeError, ValueError):
        per_page = default_per_page

    pag = query.paginate(page=page, per_page=per_page, error_out=False)
    return pag.items, {
        "page": pag.page,
        "per_page": pag.per_page,
        "total": pag.total,
        "pages": pag.pages,
    }


def serialize_list(items: Iterable, **kwargs) -> list:
    return [i.to_dict(**kwargs) if hasattr(i, "to_dict") else i for i in items]


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_EXTENSIONS"]
    )


def save_upload(file_storage, subfolder: str = "") -> Optional[str]:
    """Save an uploaded file and return public URL path."""
    if not file_storage or not file_storage.filename:
        return None
    if not allowed_file(file_storage.filename):
        return None
    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(folder, exist_ok=True)
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    name = f"{uuid.uuid4().hex}.{ext}"
    safe = secure_filename(name)
    file_storage.save(os.path.join(folder, safe))
    rel = f"/uploads/{subfolder}/{safe}" if subfolder else f"/uploads/{safe}"
    return rel


def push_notification(
    user_id: int,
    title_ar: str,
    title_en: str,
    body_ar: str = "",
    body_en: str = "",
    n_type: str = "info",
    reference_id: Optional[int] = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        title_ar=title_ar,
        title_en=title_en,
        body_ar=body_ar,
        body_en=body_en,
        type=n_type,
        reference_id=reference_id,
    )
    db.session.add(n)
    db.session.commit()
    return n


def notify_role(role: str, *, title_ar: str, title_en: str, body_ar: str = "", body_en: str = "",
                n_type: str = "info", reference_id: Optional[int] = None,
                hospital_id: Optional[int] = None) -> int:
    """Send notification to all users of a role (optionally scoped to hospital)."""
    from ..models.user import User
    q = User.query.filter_by(role=role, is_active=True)
    if hospital_id is not None:
        q = q.filter_by(hospital_id=hospital_id)
    count = 0
    for u in q.all():
        db.session.add(
            Notification(
                user_id=u.id,
                title_ar=title_ar,
                title_en=title_en,
                body_ar=body_ar,
                body_en=body_en,
                type=n_type,
                reference_id=reference_id,
            )
        )
        count += 1
    if count:
        db.session.commit()
    return count
