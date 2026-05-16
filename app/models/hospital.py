"""Hospital, specialty, and bed history models."""
from datetime import datetime
from .. import db

HOSPITAL_TYPES = ("public", "private", "clinic", "CHU")


class Hospital(db.Model):
    __tablename__ = "hospitals"

    id = db.Column(db.Integer, primary_key=True)
    name_ar = db.Column(db.String(200), nullable=False)
    name_en = db.Column(db.String(200), nullable=False)
    wilaya_id = db.Column(db.Integer, db.ForeignKey("wilayas.id"), nullable=False)
    commune_id = db.Column(db.Integer, db.ForeignKey("communes.id"), nullable=True)
    address = db.Column(db.String(500))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    phone = db.Column(db.String(30))
    type = db.Column(db.Enum(*HOSPITAL_TYPES, name="hospital_type"), nullable=False, default="public")
    total_beds = db.Column(db.Integer, default=0, nullable=False)
    available_beds = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    wilaya = db.relationship("Wilaya", foreign_keys=[wilaya_id])
    commune = db.relationship("Commune", foreign_keys=[commune_id])
    specialties = db.relationship(
        "HospitalSpecialty", backref="hospital", cascade="all,delete-orphan", lazy="dynamic"
    )

    def to_dict(self, include_specialties: bool = False) -> dict:
        data = {
            "id": self.id,
            "name_ar": self.name_ar,
            "name_en": self.name_en,
            "wilaya_id": self.wilaya_id,
            "commune_id": self.commune_id,
            "wilaya_name_ar": self.wilaya.name_ar if self.wilaya else None,
            "commune_name_ar": self.commune.name_ar if self.commune else None,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "phone": self.phone,
            "type": self.type,
            "total_beds": self.total_beds,
            "available_beds": self.available_beds,
            "is_active": self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_specialties:
            data["specialties"] = [s.to_dict() for s in self.specialties.all()]
        return data


class HospitalSpecialty(db.Model):
    __tablename__ = "hospital_specialties"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    specialty_name_ar = db.Column(db.String(150), nullable=False)
    specialty_name_en = db.Column(db.String(150), nullable=False)
    doctor_count = db.Column(db.Integer, default=0, nullable=False)
    is_available = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "specialty_name_ar": self.specialty_name_ar,
            "specialty_name_en": self.specialty_name_en,
            "doctor_count": self.doctor_count,
            "is_available": self.is_available,
        }


class BedHistory(db.Model):
    """Audit log of every bed count change."""

    __tablename__ = "bed_history"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    available_beds = db.Column(db.Integer, nullable=False)
    total_beds = db.Column(db.Integer, nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "available_beds": self.available_beds,
            "total_beds": self.total_beds,
            "changed_by": self.changed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
