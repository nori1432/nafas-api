"""User model."""
from datetime import datetime
import bcrypt
from .. import db

USER_ROLES = (
    "citizen",
    "doctor",
    "engineer",
    "donor",
    "hospital_admin",
    "maintenance_company",
    "national_admin",
)

BLOOD_TYPES = ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(*USER_ROLES, name="user_role"), nullable=False, default="citizen")
    wilaya = db.Column(db.String(100))
    commune = db.Column(db.String(100))
    profile_photo_url = db.Column(db.String(500))
    blood_type = db.Column(db.Enum(*BLOOD_TYPES, name="blood_type"))
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    # Foreign key to hospital for hospital_admin / doctor / engineer staff scoping
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=True)
    license_document_url = db.Column(db.String(500))
    # Doctor-specific fields
    specialty = db.Column(db.String(150))
    bio_ar = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode("utf-8"), self.password_hash.encode("utf-8"))
        except Exception:
            return False

    def to_dict(self, include_sensitive: bool = False) -> dict:
        data = {
            "id": self.id,
            "full_name": self.full_name,
            "phone_number": self.phone_number,
            "role": self.role,
            "wilaya": self.wilaya,
            "commune": self.commune,
            "profile_photo_url": self.profile_photo_url,
            "blood_type": self.blood_type,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "hospital_id": self.hospital_id,
            "specialty": self.specialty,
            "bio_ar": self.bio_ar,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_sensitive:
            data["license_document_url"] = self.license_document_url
        return data
