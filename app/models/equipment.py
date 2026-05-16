"""Equipment, maintenance, repair center models."""
from datetime import datetime
from .. import db

EQUIPMENT_STATUS = ("operational", "faulty", "under_repair", "decommissioned")
MAINT_SEVERITY = ("low", "medium", "high", "critical")
MAINT_STATUS = ("open", "assigned", "in_progress", "resolved", "closed")
REPAIR_TYPE = ("public", "private")
REPAIR_SCOPE = ("local", "national", "international")


class Equipment(db.Model):
    __tablename__ = "equipment"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    name_ar = db.Column(db.String(200), nullable=False)
    name_en = db.Column(db.String(200), nullable=False)
    serial_number = db.Column(db.String(100))
    category = db.Column(db.String(100))
    status = db.Column(
        db.Enum(*EQUIPMENT_STATUS, name="equipment_status"),
        nullable=False,
        default="operational",
    )
    last_maintenance = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "name_ar": self.name_ar,
            "name_en": self.name_en,
            "serial_number": self.serial_number,
            "category": self.category,
            "status": self.status,
            "last_maintenance": self.last_maintenance.isoformat() if self.last_maintenance else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RepairCenter(db.Model):
    __tablename__ = "repair_centers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.Enum(*REPAIR_TYPE, name="repair_type"), nullable=False, default="public")
    scope = db.Column(db.Enum(*REPAIR_SCOPE, name="repair_scope"), nullable=False, default="local")
    wilaya_id = db.Column(db.Integer, db.ForeignKey("wilayas.id"), nullable=True)
    contact_phone = db.Column(db.String(30))
    contact_email = db.Column(db.String(150))
    specialties_json = db.Column(db.JSON)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "scope": self.scope,
            "wilaya_id": self.wilaya_id,
            "contact_phone": self.contact_phone,
            "contact_email": self.contact_email,
            "specialties": self.specialties_json or [],
            "is_approved": self.is_approved,
        }


class MaintenanceReport(db.Model):
    __tablename__ = "maintenance_reports"

    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey("equipment.id"), nullable=False)
    reported_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    fault_description = db.Column(db.Text, nullable=False)
    severity = db.Column(
        db.Enum(*MAINT_SEVERITY, name="maint_severity"), nullable=False, default="medium"
    )
    required_parts = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    repair_center_id = db.Column(db.Integer, db.ForeignKey("repair_centers.id"), nullable=True)
    status = db.Column(
        db.Enum(*MAINT_STATUS, name="maint_status"), nullable=False, default="open"
    )
    resolution_notes = db.Column(db.Text)
    opened_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime)

    equipment = db.relationship("Equipment", foreign_keys=[equipment_id])
    reporter = db.relationship("User", foreign_keys=[reported_by])
    assignee = db.relationship("User", foreign_keys=[assigned_to])
    repair_center = db.relationship("RepairCenter", foreign_keys=[repair_center_id])

    def to_dict(self):
        return {
            "id": self.id,
            "equipment_id": self.equipment_id,
            "equipment_name": self.equipment.name_ar if self.equipment else None,
            "hospital_id": self.equipment.hospital_id if self.equipment else None,
            "reported_by": self.reported_by,
            "reporter_name": self.reporter.full_name if self.reporter else None,
            "fault_description": self.fault_description,
            "severity": self.severity,
            "required_parts": self.required_parts,
            "assigned_to": self.assigned_to,
            "assignee_name": self.assignee.full_name if self.assignee else None,
            "repair_center_id": self.repair_center_id,
            "repair_center_name": self.repair_center.name if self.repair_center else None,
            "status": self.status,
            "resolution_notes": self.resolution_notes,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }
