"""Medical record model."""
from datetime import datetime
from .. import db


class MedicalRecord(db.Model):
    __tablename__ = "medical_records"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=True)
    diagnosis = db.Column(db.Text, nullable=False)
    prescription = db.Column(db.Text)
    notes = db.Column(db.Text)
    attachments_json = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    patient = db.relationship("User", foreign_keys=[patient_id])
    doctor = db.relationship("User", foreign_keys=[doctor_id])
    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.full_name if self.doctor else None,
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "notes": self.notes,
            "attachments": self.attachments_json or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
