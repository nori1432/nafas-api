"""Appointment and doctor schedule routes."""
from datetime import datetime, timedelta, date as _date
from flask import Blueprint, request

from .. import db
from ..models.appointment import Appointment, DoctorSchedule, APPOINTMENT_STATUS
from ..models.user import User
from ..models.hospital import Hospital
from ..utils.helpers import ok, fail, paginate, serialize_list, push_notification
from ..utils.decorators import jwt_user_required, role_required

bp = Blueprint("appointments", __name__)

SLOT_MINUTES = 30  # each appointment slot is 30 minutes


# ─────────────────── patient / citizen appointments ───────────────────

@bp.get("/appointments")
@jwt_user_required
def my_appointments(current_user):
    """Admin sees all; doctor sees own; patient sees own."""
    q = Appointment.query
    if current_user.role == "national_admin":
        if (h := request.args.get("hospital_id")):
            q = q.filter_by(hospital_id=int(h))
    elif current_user.role == "hospital_admin":
        q = q.filter_by(hospital_id=current_user.hospital_id)
    elif current_user.role == "doctor":
        q = q.filter_by(doctor_id=current_user.id)
    else:
        q = q.filter_by(patient_id=current_user.id)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    if (did := request.args.get("doctor_id")):
        q = q.filter_by(doctor_id=int(did))
    q = q.order_by(Appointment.date_time.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.post("/appointments")
@jwt_user_required
def create_appointment(current_user):
    data = request.get_json(silent=True) or {}
    required = ("doctor_id", "hospital_id", "date_time")
    if any(not data.get(k) for k in required):
        return fail("doctor_id, hospital_id, date_time required", 422)
    try:
        dt = datetime.fromisoformat(data["date_time"].replace("Z", "+00:00"))
        dt = dt.replace(tzinfo=None, second=0, microsecond=0)
    except (ValueError, AttributeError):
        return fail("Invalid date_time (ISO 8601)", 422)
    if dt < datetime.utcnow():
        return fail("Cannot book in the past", 422)
    doctor = User.query.get(int(data["doctor_id"]))
    if not doctor or doctor.role != "doctor":
        return fail("Doctor not found", 404)
    Hospital.query.get_or_404(int(data["hospital_id"]))

    # Verify the slot falls within doctor's schedule
    day = dt.weekday()  # 0=Mon
    schedule = DoctorSchedule.query.filter_by(
        doctor_id=doctor.id, hospital_id=int(data["hospital_id"]),
        day_of_week=day, is_active=True).first()
    if schedule:
        slot_time = dt.time().replace(second=0, microsecond=0)
        from datetime import time as _t
        if not (schedule.start_time <= slot_time < schedule.end_time):
            return fail("Slot is outside doctor's working hours", 422)

    # Patient cannot double-book
    clash_p = Appointment.query.filter_by(patient_id=current_user.id, date_time=dt).filter(
        Appointment.status.in_(("pending", "confirmed"))
    ).first()
    if clash_p:
        return fail("You already have an appointment at this time", 409)

    # Doctor cannot be double-booked
    clash_d = Appointment.query.filter_by(doctor_id=doctor.id, date_time=dt).filter(
        Appointment.status.in_(("pending", "confirmed"))
    ).first()
    if clash_d:
        return fail("Doctor is not available at this time", 409)

    a = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor.id,
        hospital_id=int(data["hospital_id"]),
        specialty=data.get("specialty") or doctor.specialty,
        date_time=dt,
        notes=data.get("notes"),
    )
    db.session.add(a)
    db.session.commit()

    push_notification(
        doctor.id,
        title_ar="موعد جديد",
        title_en="New appointment",
        body_ar=f"تم حجز موعد من قبل {current_user.full_name}",
        body_en=f"New appointment booked by {current_user.full_name}",
        n_type="appointment",
        reference_id=a.id,
    )
    return ok(a.to_dict(), "Appointment created", 201)


@bp.put("/appointments/<int:aid>")
@jwt_user_required
def update_appointment(aid, current_user):
    a = Appointment.query.get_or_404(aid)
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in APPOINTMENT_STATUS:
        return fail("Invalid status", 422)

    if current_user.role in ("national_admin", "hospital_admin"):
        pass  # full access
    elif current_user.role == "doctor":
        if a.doctor_id != current_user.id:
            return fail("Forbidden", 403)
    else:
        if a.patient_id != current_user.id:
            return fail("Forbidden", 403)
        if new_status != "cancelled":
            return fail("Patients can only cancel", 403)
        if a.date_time - datetime.utcnow() < timedelta(hours=2):
            return fail("Cancellation must be at least 2 hours in advance", 422)

    a.status = new_status
    if "notes" in data:
        a.notes = data["notes"]
    db.session.commit()

    target = a.patient_id if current_user.id != a.patient_id else a.doctor_id
    push_notification(
        target,
        title_ar=f"تحديث الموعد: {new_status}",
        title_en=f"Appointment {new_status}",
        body_ar="تم تحديث حالة الموعد الخاص بك.",
        body_en="Your appointment status has been updated.",
        n_type="appointment",
        reference_id=a.id,
    )
    return ok(a.to_dict(), "Updated")


# ─────────────────── doctor-specific views ───────────────────

@bp.get("/appointments/doctor")
@role_required("doctor")
def doctor_appointments(current_user):
    q = Appointment.query.filter_by(doctor_id=current_user.id)
    if (s := request.args.get("status")):
        q = q.filter_by(status=s)
    q = q.order_by(Appointment.date_time.asc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


# ─────────────────── available slots ───────────────────

@bp.get("/doctors/<int:did>/available-slots")
@jwt_user_required
def available_slots(did, current_user):
    """
    Returns available 30-min slot datetimes for a doctor on a given date.
    Query params: date=YYYY-MM-DD  hospital_id=<int>
    """
    date_str = request.args.get("date")
    hospital_id = request.args.get("hospital_id")
    if not date_str:
        return fail("date required (YYYY-MM-DD)", 422)
    try:
        target_date = _date.fromisoformat(date_str)
    except ValueError:
        return fail("Invalid date format", 422)

    if target_date < _date.today():
        return ok([])

    doctor = User.query.filter_by(id=did, role="doctor", is_active=True).first_or_404()

    # Get schedule for this day of week
    day = target_date.weekday()
    q = DoctorSchedule.query.filter_by(doctor_id=did, day_of_week=day, is_active=True)
    if hospital_id:
        q = q.filter_by(hospital_id=int(hospital_id))
    schedule = q.first()

    if not schedule:
        return ok([])  # doctor doesn't work this day

    # Generate all 30-min slots
    from datetime import time as _t
    slots = []
    current = datetime.combine(target_date, schedule.start_time)
    end = datetime.combine(target_date, schedule.end_time)
    now = datetime.utcnow() + timedelta(hours=1)  # 1h buffer from now

    while current < end:
        slots.append(current)
        current += timedelta(minutes=SLOT_MINUTES)

    # Remove already-booked slots
    day_start = datetime.combine(target_date, _t(0, 0))
    day_end = datetime.combine(target_date, _t(23, 59))
    booked = {
        a.date_time.replace(second=0, microsecond=0)
        for a in Appointment.query.filter(
            Appointment.doctor_id == did,
            Appointment.date_time >= day_start,
            Appointment.date_time <= day_end,
            Appointment.status.in_(("pending", "confirmed")),
        ).all()
    }

    available = [
        s.isoformat()
        for s in slots
        if s not in booked and s > now
    ]
    return ok(available)


@bp.get("/doctors/<int:did>/working-days")
@jwt_user_required
def doctor_working_days(did, current_user):
    """Return days of week (0=Mon…6=Sun) the doctor works."""
    hospital_id = request.args.get("hospital_id")
    q = DoctorSchedule.query.filter_by(doctor_id=did, is_active=True)
    if hospital_id:
        q = q.filter_by(hospital_id=int(hospital_id))
    days = sorted({s.day_of_week for s in q.all()})
    return ok(days)


# ─────────────────── doctor schedules CRUD ───────────────────

@bp.get("/hospitals/<int:hid>/schedules")
def list_schedules(hid):
    doctor_id = request.args.get("doctor_id")
    q = DoctorSchedule.query.filter_by(hospital_id=hid, is_active=True)
    if doctor_id:
        q = q.filter_by(doctor_id=int(doctor_id))
    return ok(serialize_list(q.all()))


@bp.post("/hospitals/<int:hid>/schedules")
@role_required("doctor", "hospital_admin")
def create_schedule(hid, current_user):
    data = request.get_json(silent=True) or {}
    required = ("day_of_week", "start_time", "end_time")
    if any(data.get(k) is None for k in required):
        return fail("day_of_week, start_time, end_time required", 422)
    try:
        from datetime import time as _t
        sh, sm = map(int, data["start_time"].split(":"))
        eh, em = map(int, data["end_time"].split(":"))
        st, et = _t(sh, sm), _t(eh, em)
    except (ValueError, AttributeError):
        return fail("Invalid time format (HH:MM)", 422)
    if et <= st:
        return fail("end_time must be after start_time", 422)
    doctor_id = (
        current_user.id if current_user.role == "doctor"
        else int(data.get("doctor_id", 0))
    )
    if not doctor_id:
        return fail("doctor_id required", 422)
    s = DoctorSchedule(
        doctor_id=doctor_id,
        hospital_id=hid,
        day_of_week=int(data["day_of_week"]),
        start_time=st,
        end_time=et,
        max_appointments=int(data.get("max_appointments", 10)),
        is_active=bool(data.get("is_active", True)),
    )
    db.session.add(s)
    db.session.commit()
    return ok(s.to_dict(), "Schedule created", 201)


@bp.delete("/hospitals/<int:hid>/schedules/<int:sid>")
@role_required("doctor", "hospital_admin")
def delete_schedule(hid, sid, current_user):
    s = DoctorSchedule.query.filter_by(id=sid, hospital_id=hid).first_or_404()
    if current_user.role == "doctor" and s.doctor_id != current_user.id:
        return fail("Forbidden", 403)
    db.session.delete(s)
    db.session.commit()
    return ok(message="Schedule deleted")
