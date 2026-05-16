"""Donation models: blood, organ, financial, tracking."""
from datetime import datetime
from .. import db

CAMPAIGN_STATUS = ("active", "completed", "cancelled")
BLOOD_DONATION_STATUS = ("scheduled", "completed", "cancelled")
ORGAN_STATUS = ("registered", "under_review", "approved", "rejected")
FINANCIAL_STATUS = ("pending", "confirmed", "disbursed")
FINANCIAL_PURPOSE = ("general", "equipment", "remote_area")
DONATION_TYPE = ("blood", "organ", "financial")


class BloodCampaign(db.Model):
    __tablename__ = "blood_campaigns"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    title_ar = db.Column(db.String(200), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    blood_types_needed_json = db.Column(db.JSON, nullable=False)
    target_units = db.Column(db.Integer, nullable=False, default=0)
    collected_units = db.Column(db.Integer, nullable=False, default=0)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(
        db.Enum(*CAMPAIGN_STATUS, name="campaign_status"), nullable=False, default="active"
    )
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "title_ar": self.title_ar,
            "title_en": self.title_en,
            "blood_types_needed": self.blood_types_needed_json or [],
            "target_units": self.target_units,
            "collected_units": self.collected_units,
            "progress_percent": (
                int(self.collected_units * 100 / self.target_units) if self.target_units else 0
            ),
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BloodDonation(db.Model):
    __tablename__ = "blood_donations"

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey("blood_campaigns.id"), nullable=True)
    blood_type = db.Column(db.String(5), nullable=False)
    donation_date = db.Column(db.Date, nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    status = db.Column(
        db.Enum(*BLOOD_DONATION_STATUS, name="blood_donation_status"),
        nullable=False,
        default="scheduled",
    )

    donor = db.relationship("User", foreign_keys=[donor_id])
    campaign = db.relationship("BloodCampaign", foreign_keys=[campaign_id])
    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "donor_id": self.donor_id,
            "donor_name": self.donor.full_name if self.donor else None,
            "campaign_id": self.campaign_id,
            "blood_type": self.blood_type,
            "donation_date": self.donation_date.isoformat() if self.donation_date else None,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "status": self.status,
        }


class OrganDonation(db.Model):
    __tablename__ = "organ_donations"

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    organs_json = db.Column(db.JSON, nullable=False)
    legal_document_url = db.Column(db.String(500))
    status = db.Column(
        db.Enum(*ORGAN_STATUS, name="organ_status"), nullable=False, default="registered"
    )
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    donor = db.relationship("User", foreign_keys=[donor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "donor_id": self.donor_id,
            "donor_name": self.donor.full_name if self.donor else None,
            "organs": self.organs_json or [],
            "legal_document_url": self.legal_document_url,
            "status": self.status,
            "reviewed_by": self.reviewed_by,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class FinancialDonation(db.Model):
    __tablename__ = "financial_donations"

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    currency = db.Column(db.String(8), nullable=False, default="DZD")
    purpose = db.Column(
        db.Enum(*FINANCIAL_PURPOSE, name="financial_purpose"),
        nullable=False,
        default="general",
    )
    target_equipment = db.Column(db.String(200))
    transaction_ref = db.Column(db.String(150))
    status = db.Column(
        db.Enum(*FINANCIAL_STATUS, name="financial_status"),
        nullable=False,
        default="pending",
    )
    confirmed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    donated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = db.Column(db.DateTime)

    donor = db.relationship("User", foreign_keys=[donor_id])
    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "donor_id": self.donor_id,
            "donor_name": self.donor.full_name if self.donor else None,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "amount": float(self.amount) if self.amount is not None else 0,
            "currency": self.currency,
            "purpose": self.purpose,
            "target_equipment": self.target_equipment,
            "transaction_ref": self.transaction_ref,
            "status": self.status,
            "confirmed_by": self.confirmed_by,
            "donated_at": self.donated_at.isoformat() if self.donated_at else None,
            "confirmed_at": self.confirmed_at.isoformat() if self.confirmed_at else None,
        }


class DonationTracking(db.Model):
    __tablename__ = "donation_tracking"

    id = db.Column(db.Integer, primary_key=True)
    donation_type = db.Column(db.Enum(*DONATION_TYPE, name="donation_type"), nullable=False)
    donation_id = db.Column(db.Integer, nullable=False, index=True)
    status_update = db.Column(db.String(80), nullable=False)
    notes = db.Column(db.Text)
    updated_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "donation_type": self.donation_type,
            "donation_id": self.donation_id,
            "status_update": self.status_update,
            "notes": self.notes,
            "updated_by": self.updated_by,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
