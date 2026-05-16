"""Notifications."""
from datetime import datetime
from .. import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title_ar = db.Column(db.String(200), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    body_ar = db.Column(db.Text)
    body_en = db.Column(db.Text)
    type = db.Column(db.String(60), nullable=False, default="info")
    reference_id = db.Column(db.Integer)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title_ar": self.title_ar,
            "title_en": self.title_en,
            "body_ar": self.body_ar,
            "body_en": self.body_en,
            "type": self.type,
            "reference_id": self.reference_id,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
