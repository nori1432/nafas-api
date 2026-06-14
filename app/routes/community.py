"""Community routes: Ask the Doctor and Medical Forums."""
from flask import Blueprint, request

from .. import db
from ..models.community import (
    CommunityQuestion,
    QuestionReply,
    ForumPost,
    ForumReply,
    FORUM_SPECIALTIES,
    URGENCY_LEVELS,
    QUESTION_STATUS,
)
from ..utils.helpers import ok, fail, paginate, serialize_list, push_notification, notify_role
from ..utils.decorators import jwt_user_required

bp = Blueprint("community", __name__)

_STAFF_ROLES = ("doctor", "hospital_admin", "national_admin")


# ─── Ask the Doctor ──────────────────────────────────────────────────────────

@bp.post("/community/questions")
@jwt_user_required
def create_question(current_user):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    if not title or not body:
        return fail("title and body are required", 422)

    urgency = data.get("urgency", "low")
    if urgency not in URGENCY_LEVELS:
        return fail(f"urgency must be one of {URGENCY_LEVELS}", 422)

    specialty = data.get("specialty")
    hospital_id = data.get("hospital_id")

    q = CommunityQuestion(
        user_id=current_user.id,
        title=title,
        body=body,
        specialty=specialty,
        urgency=urgency,
        hospital_id=int(hospital_id) if hospital_id else None,
        status="open",
    )
    db.session.add(q)
    db.session.commit()

    notify_role(
        "doctor",
        title_ar="سؤال طبي جديد",
        title_en="New medical question",
        body_ar=f"سؤال جديد من مريض: {title}",
        body_en=f"New patient question: {title}",
        n_type="community",
        reference_id=q.id,
        hospital_id=int(hospital_id) if hospital_id else None,
    )
    return ok(q.to_dict(), "Question submitted", 201)


@bp.get("/community/questions")
@jwt_user_required
def list_questions(current_user):
    q = CommunityQuestion.query
    if current_user.role not in _STAFF_ROLES:
        q = q.filter_by(user_id=current_user.id)
    elif current_user.role == "hospital_admin" and current_user.hospital_id:
        q = q.filter(
            (CommunityQuestion.hospital_id == current_user.hospital_id)
            | (CommunityQuestion.hospital_id.is_(None))
        )
    if (s := request.args.get("status")) and s in QUESTION_STATUS:
        q = q.filter_by(status=s)
    if sp := request.args.get("specialty"):
        q = q.filter_by(specialty=sp)
    q = q.order_by(CommunityQuestion.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/community/questions/<int:qid>")
@jwt_user_required
def get_question(qid, current_user):
    question = CommunityQuestion.query.get_or_404(qid)
    if current_user.role not in _STAFF_ROLES and question.user_id != current_user.id:
        return fail("Forbidden", 403)
    result = question.to_dict()
    result["replies"] = serialize_list(
        question.replies.order_by(QuestionReply.created_at).all()
    )
    return ok(result)


@bp.post("/community/questions/<int:qid>/reply")
@jwt_user_required
def reply_to_question(qid, current_user):
    question = CommunityQuestion.query.get_or_404(qid)
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return fail("body is required", 422)

    is_staff = current_user.role in _STAFF_ROLES
    r = QuestionReply(
        question_id=qid,
        user_id=current_user.id,
        body=body,
        is_medical_staff=is_staff,
    )
    db.session.add(r)
    if is_staff and question.status == "open":
        question.status = "answered"
    db.session.commit()

    push_notification(
        question.user_id,
        title_ar="تم الرد على سؤالك",
        title_en="Your question was answered",
        body_ar=body[:120],
        body_en=body[:120],
        n_type="community",
        reference_id=qid,
    )
    return ok(r.to_dict(), "Reply added", 201)


# ─── Medical Forums ───────────────────────────────────────────────────────────

@bp.get("/community/forums/specialties")
@jwt_user_required
def list_specialties(current_user):
    return ok(list(FORUM_SPECIALTIES))


@bp.get("/community/forums/posts")
@jwt_user_required
def list_posts(current_user):
    specialty = request.args.get("specialty")
    if not specialty or specialty not in FORUM_SPECIALTIES:
        return fail(f"specialty must be one of {FORUM_SPECIALTIES}", 422)
    q = ForumPost.query.filter_by(specialty=specialty, status="active")
    q = q.order_by(ForumPost.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/community/forums/posts")
@jwt_user_required
def create_post(current_user):
    data = request.get_json(silent=True) or {}
    specialty = data.get("specialty")
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()

    if not specialty or specialty not in FORUM_SPECIALTIES:
        return fail(f"specialty must be one of {FORUM_SPECIALTIES}", 422)
    if not title or not body:
        return fail("title and body are required", 422)

    post = ForumPost(
        user_id=current_user.id,
        specialty=specialty,
        title=title,
        body=body,
        status="active",
    )
    db.session.add(post)
    db.session.commit()
    return ok(post.to_dict(), "Post created", 201)


@bp.get("/community/forums/posts/<int:pid>")
@jwt_user_required
def get_post(pid, current_user):
    post = ForumPost.query.get_or_404(pid)
    result = post.to_dict()
    result["replies"] = serialize_list(
        post.replies.order_by(ForumReply.created_at).all()
    )
    return ok(result)


@bp.put("/community/questions/<int:qid>/status")
@jwt_user_required
def update_question_status(qid, current_user):
    question = CommunityQuestion.query.get_or_404(qid)
    if current_user.role not in _STAFF_ROLES and question.user_id != current_user.id:
        return fail("Forbidden", 403)
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in QUESTION_STATUS:
        return fail(f"status must be one of {QUESTION_STATUS}", 422)
    question.status = new_status
    db.session.commit()
    return ok(question.to_dict(), "Status updated")


@bp.put("/community/forums/posts/<int:pid>/close")
@jwt_user_required
def close_post(pid, current_user):
    if current_user.role not in _STAFF_ROLES:
        return fail("Forbidden", 403)
    post = ForumPost.query.get_or_404(pid)
    post.status = "closed"
    db.session.commit()
    return ok(post.to_dict(), "Post closed")


@bp.post("/community/forums/posts/<int:pid>/replies")
@jwt_user_required
def reply_to_post(pid, current_user):
    post = ForumPost.query.get_or_404(pid)
    if post.status == "closed":
        return fail("This forum post is closed", 403)
    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return fail("body is required", 422)

    r = ForumReply(
        post_id=pid,
        user_id=current_user.id,
        body=body,
        is_medical_staff=current_user.role in _STAFF_ROLES,
    )
    db.session.add(r)
    db.session.commit()

    if post.user_id != current_user.id:
        push_notification(
            post.user_id,
            title_ar="رد جديد على منشورك",
            title_en="New reply to your post",
            body_ar=body[:120],
            body_en=body[:120],
            n_type="community",
            reference_id=pid,
        )
    return ok(r.to_dict(), "Reply added", 201)
