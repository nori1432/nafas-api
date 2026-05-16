"""Maintenance company portfolio, hospital maintenance needs, service offers, and subscriptions."""
from datetime import datetime
from .. import db

NEED_URGENCY = ("low", "medium", "high", "critical")
NEED_STATUS  = ("open", "reviewing", "assigned", "in_progress", "resolved", "closed")
OFFER_STATUS = ("pending", "accepted", "rejected", "withdrawn", "completed")
SUB_PLAN     = ("basic", "standard", "premium")
SUB_STATUS   = ("active", "expired", "cancelled", "trial")


class MaintenanceCompany(db.Model):
    __tablename__ = "maintenance_companies"

    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    company_name   = db.Column(db.String(200), nullable=False)
    description    = db.Column(db.Text)
    services       = db.Column(db.JSON)          # ["Electrical", "HVAC", ...]
    certifications = db.Column(db.JSON)          # ["ISO 9001", ...]
    wilaya_id      = db.Column(db.Integer, db.ForeignKey("wilayas.id"), nullable=True)
    coverage_wilayas = db.Column(db.JSON)        # [16, 9, 35, ...]
    contact_email  = db.Column(db.String(150))
    contact_phone  = db.Column(db.String(30))
    website        = db.Column(db.String(300))
    logo_url       = db.Column(db.String(500))
    is_approved    = db.Column(db.Boolean, default=False, nullable=False)
    is_active      = db.Column(db.Boolean, default=True,  nullable=False)
    founded_year   = db.Column(db.Integer)
    employee_count = db.Column(db.Integer)
    completed_jobs = db.Column(db.Integer, default=0, nullable=False)
    rating         = db.Column(db.Float,   default=0.0, nullable=False)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_phone": self.user.phone_number if self.user else None,
            "company_name": self.company_name,
            "description": self.description,
            "services": self.services or [],
            "certifications": self.certifications or [],
            "wilaya_id": self.wilaya_id,
            "coverage_wilayas": self.coverage_wilayas or [],
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "website": self.website,
            "logo_url": self.logo_url,
            "is_approved": self.is_approved,
            "is_active": self.is_active,
            "founded_year": self.founded_year,
            "employee_count": self.employee_count,
            "completed_jobs": self.completed_jobs,
            "rating": self.rating,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MaintenanceNeed(db.Model):
    __tablename__ = "maintenance_needs"

    id           = db.Column(db.Integer, primary_key=True)
    hospital_id  = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    equipment_id = db.Column(db.Integer, db.ForeignKey("equipment.id"), nullable=True)
    title        = db.Column(db.String(300), nullable=False)
    description  = db.Column(db.Text, nullable=False)
    urgency      = db.Column(db.Enum(*NEED_URGENCY, name="need_urgency"), nullable=False, default="medium")
    status       = db.Column(db.Enum(*NEED_STATUS,  name="need_status"),  nullable=False, default="open")
    budget_min   = db.Column(db.Float)
    budget_max   = db.Column(db.Float)
    deadline     = db.Column(db.Date)
    created_by   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    hospital  = db.relationship("Hospital",  foreign_keys=[hospital_id])
    equipment = db.relationship("Equipment", foreign_keys=[equipment_id])
    creator   = db.relationship("User",      foreign_keys=[created_by])
    offers    = db.relationship("ServiceOffer", backref="need", cascade="all,delete-orphan", lazy="dynamic")

    def to_dict(self, include_offers=False):
        d = {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_en if self.hospital else None,
            "equipment_id": self.equipment_id,
            "equipment_name": self.equipment.name_en if self.equipment else None,
            "title": self.title,
            "description": self.description,
            "urgency": self.urgency,
            "status": self.status,
            "budget_min": self.budget_min,
            "budget_max": self.budget_max,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "offer_count": self.offers.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_offers:
            d["offers"] = [o.to_dict() for o in self.offers.all()]
        return d


class ServiceOffer(db.Model):
    __tablename__ = "service_offers"

    id              = db.Column(db.Integer, primary_key=True)
    need_id         = db.Column(db.Integer, db.ForeignKey("maintenance_needs.id"), nullable=False)
    company_id      = db.Column(db.Integer, db.ForeignKey("maintenance_companies.id"), nullable=False)
    description     = db.Column(db.Text, nullable=False)
    price           = db.Column(db.Float, nullable=False)
    currency        = db.Column(db.String(10), default="DZD")
    duration_days   = db.Column(db.Integer, nullable=False)
    warranty_months = db.Column(db.Integer, default=0)
    notes           = db.Column(db.Text)
    status          = db.Column(db.Enum(*OFFER_STATUS, name="offer_status"), nullable=False, default="pending")
    created_at      = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company = db.relationship("MaintenanceCompany", foreign_keys=[company_id])

    def to_dict(self):
        return {
            "id": self.id,
            "need_id": self.need_id,
            "company_id": self.company_id,
            "company_name": self.company.company_name if self.company else None,
            "description": self.description,
            "price": self.price,
            "currency": self.currency,
            "duration_days": self.duration_days,
            "warranty_months": self.warranty_months,
            "notes": self.notes,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Subscription(db.Model):
    __tablename__ = "subscriptions"

    id              = db.Column(db.Integer, primary_key=True)
    hospital_id     = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False, unique=True)
    plan            = db.Column(db.Enum(*SUB_PLAN,    name="sub_plan"),    nullable=False, default="basic")
    status          = db.Column(db.Enum(*SUB_STATUS,  name="sub_status"),  nullable=False, default="trial")
    price_monthly   = db.Column(db.Float, default=0.0, nullable=False)
    start_date      = db.Column(db.Date, nullable=False)
    end_date        = db.Column(db.Date, nullable=False)
    notes           = db.Column(db.Text)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_en if self.hospital else None,
            "plan": self.plan,
            "status": self.status,
            "price_monthly": self.price_monthly,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "notes": self.notes,
        }
