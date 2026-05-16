"""Complaints and hospital ratings."""
from datetime import datetime
from .. import db

COMPLAINT_CATEGORY = ("service", "cleanliness", "staff", "equipment", "waiting_time", "other")
COMPLAINT_STATUS = ("open", "in_review", "resolved", "closed")


class Complaint(db.Model):
    __tablename__ = "complaints"

    id = db.Column(db.Integer, primary_key=True)
    submitted_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    category = db.Column(
        db.Enum(*COMPLAINT_CATEGORY, name="complaint_category"), nullable=False
    )
    description = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(500))
    status = db.Column(
        db.Enum(*COMPLAINT_STATUS, name="complaint_status"), nullable=False, default="open"
    )
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    response_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime)

    submitter = db.relationship("User", foreign_keys=[submitted_by])
    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "submitted_by": self.submitted_by,
            "submitter_name": self.submitter.full_name if self.submitter else None,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "category": self.category,
            "description": self.description,
            "attachment_url": self.attachment_url,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "response_notes": self.response_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class HospitalRating(db.Model):
    __tablename__ = "hospital_ratings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    score = db.Column(db.SmallInteger, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (db.UniqueConstraint("user_id", "hospital_id", name="uq_user_hospital_rating"),)

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "hospital_id": self.hospital_id,
            "score": self.score,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
