"""Community models: Ask the Doctor and Medical Forums."""
from datetime import datetime
from .. import db

FORUM_SPECIALTIES = (
    "neurology_mental_health",
    "mother_child_health",
    "kidney_dialysis",
    "diabetes_endocrinology",
    "chest_respiratory",
    "general_medicine",
)

URGENCY_LEVELS = ("low", "medium", "high")
QUESTION_STATUS = ("open", "answered", "closed")
POST_STATUS = ("active", "closed")


class CommunityQuestion(db.Model):
    """Patient question directed at hospital or doctor."""
    __tablename__ = "community_questions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(250), nullable=False)
    body = db.Column(db.Text, nullable=False)
    specialty = db.Column(db.String(100))
    urgency = db.Column(
        db.Enum(*URGENCY_LEVELS, name="question_urgency"), nullable=False, default="low"
    )
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=True)
    status = db.Column(
        db.Enum(*QUESTION_STATUS, name="question_status"), nullable=False, default="open"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", foreign_keys=[user_id])
    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])
    replies = db.relationship("QuestionReply", back_populates="question", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "title": self.title,
            "body": self.body,
            "specialty": self.specialty,
            "urgency": self.urgency,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "status": self.status,
            "reply_count": self.replies.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class QuestionReply(db.Model):
    """Doctor or hospital admin reply to a patient question."""
    __tablename__ = "question_replies"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("community_questions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_medical_staff = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    question = db.relationship("CommunityQuestion", back_populates="replies")
    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "body": self.body,
            "is_medical_staff": self.is_medical_staff,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ForumPost(db.Model):
    """Post in a medical specialty forum."""
    __tablename__ = "forum_posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    specialty = db.Column(
        db.Enum(*FORUM_SPECIALTIES, name="forum_specialty"), nullable=False
    )
    title = db.Column(db.String(250), nullable=False)
    body = db.Column(db.Text, nullable=False)
    status = db.Column(
        db.Enum(*POST_STATUS, name="post_status"), nullable=False, default="active"
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", foreign_keys=[user_id])
    replies = db.relationship("ForumReply", back_populates="post", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "specialty": self.specialty,
            "title": self.title,
            "body": self.body,
            "status": self.status,
            "reply_count": self.replies.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ForumReply(db.Model):
    """Reply to a forum post."""
    __tablename__ = "forum_replies"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("forum_posts.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_medical_staff = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    post = db.relationship("ForumPost", back_populates="replies")
    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "body": self.body,
            "is_medical_staff": self.is_medical_staff,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
