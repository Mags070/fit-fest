from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from database import get_db
from models.patient import Patient
from models.appointment import Appointment
from models.ambulance import AmbulanceRequest
from models.ambulance_unit import AmbulanceUnit
from models.blood import BloodRecord
from models.hospital import Hospital
from models.doctor import Doctor

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    week_later = (date.today() + timedelta(days=7)).isoformat()

    # ── Patients ──────────────────────────────────────────────────────────────
    total_patients = db.query(Patient).count()

    # ── Doctors ───────────────────────────────────────────────────────────────
    total_doctors = db.query(Doctor).count()
    available_doctors = db.query(Doctor).filter(Doctor.status == "Available").count()

    # ── Appointments ──────────────────────────────────────────────────────────
    # Exclude Cancelled appointments from today's active/completed consultations
    today_appointments = db.query(Appointment).filter(
        Appointment.appointment_date == today,
        Appointment.status != "Cancelled").count()
    scheduled_today = db.query(Appointment).filter(
        Appointment.appointment_date == today,
        Appointment.status == "Scheduled").count()
    completed_today = db.query(Appointment).filter(
        Appointment.appointment_date == today,
        Appointment.status == "Completed").count()
    cancelled_today = db.query(Appointment).filter(
        Appointment.appointment_date == today,
        Appointment.status == "Cancelled").count()
    upcoming_appointments = db.query(Appointment).filter(
        Appointment.appointment_date > today,
        Appointment.status == "Scheduled").count()
    total_appointments = db.query(Appointment).count()

    # ── Scheduled vs Completed Weekly Trend (Monday to Sunday) ───────────────
    today_obj = date.today()
    monday_obj = today_obj - timedelta(days=today_obj.weekday())
    sunday_obj = monday_obj + timedelta(days=6)

    week_start_str = monday_obj.isoformat()
    week_end_str = sunday_obj.isoformat()

    week_appts = db.query(Appointment).filter(
        Appointment.appointment_date >= week_start_str,
        Appointment.appointment_date <= week_end_str,
        Appointment.status.in_(["Scheduled", "Completed"])
    ).all()

    counts = {}
    for a in week_appts:
        d_key = a.appointment_date
        if d_key not in counts:
            counts[d_key] = {"Scheduled": 0, "Completed": 0}
        if a.status in counts[d_key]:
            counts[d_key][a.status] += 1

    DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    DAY_NAMES_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    appointment_trend = []
    for i in range(7):
        day_date = monday_obj + timedelta(days=i)
        day_date_str = day_date.isoformat()
        day_counts = counts.get(day_date_str, {"Scheduled": 0, "Completed": 0})
        appointment_trend.append({
            "date": day_date_str,
            "day": DAY_NAMES_SHORT[i],
            "day_full": DAY_NAMES_FULL[i],
            "scheduled": day_counts["Scheduled"],
            "completed": day_counts["Completed"]
        })

    # ── Follow-ups ────────────────────────────────────────────────────────────
    followups_due_today = db.query(Appointment).filter(
        Appointment.follow_up_date == today).count()
    followups_this_week = db.query(Appointment).filter(
        Appointment.follow_up_date.isnot(None),
        Appointment.follow_up_date >= today,
        Appointment.follow_up_date <= week_later).count()

    # ── Ambulance ─────────────────────────────────────────────────────────────
    pending_ambulances = db.query(AmbulanceRequest).filter(
        AmbulanceRequest.status == "PENDING").count()
    assigned_ambulances = db.query(AmbulanceRequest).filter(
        AmbulanceRequest.status == "ASSIGNED").count()
    total_ambulances = db.query(AmbulanceRequest).count()

    # Ambulance units (fleet)
    available_units = db.query(AmbulanceUnit).filter(
        AmbulanceUnit.status == "AVAILABLE").count()
    total_units = db.query(AmbulanceUnit).count()

    # ── Blood ─────────────────────────────────────────────────────────────────
    blood_records = db.query(BloodRecord).count()
    available_blood = db.query(BloodRecord).filter(
        BloodRecord.status == "AVAILABLE").count()

    # ── Hospitals ─────────────────────────────────────────────────────────────
    total_hospitals = db.query(Hospital).count()
    emergency_hospitals = db.query(Hospital).filter(
        Hospital.emergency_24h == True).count()

    return {
        # Patients
        "total_patients": total_patients,
        # Doctors
        "total_doctors": total_doctors,
        "available_doctors": available_doctors,
        # Appointments
        "today_appointments":  today_appointments,
        "scheduled_today":     scheduled_today,
        "completed_today":     completed_today,
        "cancelled_today":     cancelled_today,
        "upcoming_appointments": upcoming_appointments,
        "total_appointments":  total_appointments,
        # Appointment Trend
        "appointment_trend":   appointment_trend,
        # Structured Objects
        "today": {
            "appointments": today_appointments,
            "scheduled": scheduled_today,
            "completed": completed_today,
            "cancelled": cancelled_today,
        },
        "patients": {
            "registered": total_patients,
        },
        "doctors": {
            "available": available_doctors,
            "total": total_doctors,
        },
        "emergencies": {
            "pending": pending_ambulances,
            "assigned": assigned_ambulances,
            "total": total_ambulances,
        },
        # Follow-ups
        "followups_due_today": followups_due_today,
        "followups_this_week": followups_this_week,
        # Ambulance requests
        "pending_ambulances":  pending_ambulances,
        "assigned_ambulances": assigned_ambulances,
        "total_ambulances":    total_ambulances,
        # Fleet
        "available_units":     available_units,
        "total_units":         total_units,
        # Blood
        "blood_records":       blood_records,
        "available_blood":     available_blood,
        # Hospitals
        "total_hospitals":     total_hospitals,
        "emergency_hospitals": emergency_hospitals,
        "date": today,
    }


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Convenience alias for dashboard stats."""
    return get_dashboard(db)

