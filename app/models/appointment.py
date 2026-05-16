"""Appointment and doctor schedule models."""
from datetime import datetime
from .. import db

APPOINTMENT_STATUS = ("pending", "confirmed", "cancelled", "completed")


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    specialty = db.Column(db.String(150))
    date_time = db.Column(db.DateTime, nullable=False, index=True)
    status = db.Column(
        db.Enum(*APPOINTMENT_STATUS, name="appointment_status"),
        nullable=False,
        default="pending",
    )
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    patient = db.relationship("User", foreign_keys=[patient_id])
    doctor = db.relationship("User", foreign_keys=[doctor_id])
    hospital = db.relationship("Hospital", foreign_keys=[hospital_id])

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "hospital_id": self.hospital_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "doctor_name": self.doctor.full_name if self.doctor else None,
            "hospital_name": self.hospital.name_ar if self.hospital else None,
            "specialty": self.specialty,
            "date_time": self.date_time.isoformat() if self.date_time else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DoctorSchedule(db.Model):
    __tablename__ = "doctor_schedules"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    day_of_week = db.Column(db.SmallInteger, nullable=False)  # 0=Monday ... 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    max_appointments = db.Column(db.Integer, default=10, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "hospital_id": self.hospital_id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "max_appointments": self.max_appointments,
            "is_active": self.is_active,
        }
