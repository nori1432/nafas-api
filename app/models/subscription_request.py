"""SubscriptionRequest — public join request from hospitals / companies."""
from datetime import datetime, timezone
from .. import db


class SubscriptionRequest(db.Model):
    __tablename__ = "subscription_requests"

    id = db.Column(db.Integer, primary_key=True)
    org_type = db.Column(db.String(32), nullable=False)       # hospital | maintenance_company
    org_name = db.Column(db.String(200), nullable=False)
    wilaya = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    contact_name = db.Column(db.String(150), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=False)
    contact_email = db.Column(db.String(150), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="pending")      # pending | reviewed | approved | rejected
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = db.Column(db.DateTime, nullable=True)
    reviewer_notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "org_type": self.org_type,
            "org_name": self.org_name,
            "wilaya": self.wilaya,
            "address": self.address,
            "contact_name": self.contact_name,
            "contact_phone": self.contact_phone,
            "contact_email": self.contact_email,
            "website": self.website,
            "description": self.description,
            "status": self.status,
            "created_at": str(self.created_at),
        }
