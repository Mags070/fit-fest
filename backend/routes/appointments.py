from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from database import get_db
from models.appointment import Appointment
from models.patient import Patient
from models.doctor import Doctor
from schemas.appointment import (
    AppointmentCreate, AppointmentStatusUpdate,
    AppointmentFollowUpUpdate, AppointmentResponse,
    AutoAssignRequest, AutoAssignResponse, AutoAssignDoctorInfo
)
from routes.doctors import is_doctor_working_on_date, check_doctor_availability, format_time_12h

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


def enrich_appointment(appt: Appointment) -> dict:
    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "doctor_id": appt.doctor_id,
        "appointment_date": appt.appointment_date,
        "appointment_time": appt.appointment_time,
        "reason": appt.reason,
        "status": appt.status,
        "severity": appt.severity or "ROUTINE",
        "follow_up_date": appt.follow_up_date,
        "follow_up_notes": appt.follow_up_notes,
        "created_at": appt.created_at,
        "patient_name":       appt.patient.name       if appt.patient else None,
        "patient_phone":      appt.patient.phone      if appt.patient else None,
        "patient_blood_group":appt.patient.blood_group if appt.patient else None,
        "doctor_name":        appt.doctor.name        if appt.doctor else None,
        "doctor_specialization": appt.doctor.specialization if appt.doctor else None,
    }


@router.post("/", response_model=AppointmentResponse, status_code=201)
def create_appointment(appt: AppointmentCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # If doctor_id is provided, validate availability thoroughly
    if appt.doctor_id is not None:
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Selected doctor not found")

        try:
            target_date = datetime.strptime(appt.appointment_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

        is_avail, reason = check_doctor_availability(doctor, target_date, appt.appointment_time, db)
        if not is_avail:
            raise HTTPException(
                status_code=400,
                detail=f"{doctor.name} is no longer available for this time ({reason}). Please select another doctor."
            )

    db_appt = Appointment(**appt.model_dump())
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    db_appt = db.query(Appointment).filter(Appointment.id == db_appt.id).first()
    return enrich_appointment(db_appt)


@router.post("/auto-assign", response_model=AutoAssignResponse)
def auto_assign_doctor(req: AutoAssignRequest, db: Session = Depends(get_db)):
    """Automatically selects an available doctor with lowest active appointment workload."""
    # 1. Date validation
    if not req.appointment_date or not req.appointment_date.strip():
        raise HTTPException(status_code=400, detail="Please select an appointment date.")
    try:
        target_date = datetime.strptime(req.appointment_date.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    if target_date < date.today():
        raise HTTPException(status_code=400, detail="Please select today or a future date.")

    # 2. Time validation
    if not req.appointment_time or not req.appointment_time.strip():
        raise HTTPException(status_code=400, detail="Please select an appointment time.")
    try:
        datetime.strptime(req.appointment_time.strip(), "%H:%M")
        valid_time_str = req.appointment_time.strip()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Expected HH:MM.")

    # 3. Optional patient validation if patient_id provided
    if req.patient_id is not None:
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

    # 4. Check doctor availability using existing logic
    doctors = db.query(Doctor).all()
    available_candidates = []
    target_date_str = target_date.isoformat()

    for d in doctors:
        is_avail, _ = check_doctor_availability(d, target_date, valid_time_str, db)
        if is_avail:
            workload = db.query(Appointment).filter(
                Appointment.doctor_id == d.id,
                Appointment.appointment_date == target_date_str,
                Appointment.status == "Scheduled"
            ).count()
            available_candidates.append((workload, d))

    if not available_candidates:
        raise HTTPException(status_code=400, detail="No doctors are available for the selected date and time.")

    # Deterministic tie-breaker: sort by lowest workload, then lower doctor ID
    available_candidates.sort(key=lambda item: (item[0], item[1].id))
    lowest_workload, chosen_doctor = available_candidates[0]

    hours_display = f"{format_time_12h(chosen_doctor.start_time)} - {format_time_12h(chosen_doctor.end_time)}"

    return AutoAssignResponse(
        doctor=AutoAssignDoctorInfo(
            id=chosen_doctor.id,
            name=chosen_doctor.name,
            specialization=chosen_doctor.specialization,
            phone=chosen_doctor.phone,
            working_hours=hours_display,
            available_days=chosen_doctor.available_days,
            status=chosen_doctor.status
        ),
        appointments_today=lowest_workload,
        reason="Lowest current appointment workload among available doctors."
    )



@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    date_filter: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    patient_id: Optional[int] = Query(None),
    doctor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if date_filter:
        query = query.filter(Appointment.appointment_date == date_filter)
    if status:
        query = query.filter(Appointment.status == status)
    if severity:
        query = query.filter(Appointment.severity == severity)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    appts = query.order_by(Appointment.appointment_date, Appointment.appointment_time).all()
    return [enrich_appointment(a) for a in appts]


@router.get("/followups", response_model=List[AppointmentResponse])
def get_followups(
    upcoming_days: int = Query(7, description="Show follow-ups due in next N days"),
    db: Session = Depends(get_db)
):
    """Return appointments that have a follow-up date set (pending follow-ups)."""
    today = date.today().isoformat()
    appts = (
        db.query(Appointment)
        .filter(
            Appointment.follow_up_date.isnot(None),
            Appointment.follow_up_date >= today,
        )
        .order_by(Appointment.follow_up_date)
        .all()
    )
    return [enrich_appointment(a) for a in appts]


@router.get("/history/{patient_id}", response_model=List[AppointmentResponse])
def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    """All appointments for a specific patient, newest first."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    appts = (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient_id)
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .all()
    )
    return [enrich_appointment(a) for a in appts]


@router.get("/{appt_id}", response_model=AppointmentResponse)
def get_appointment(appt_id: int, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return enrich_appointment(appt)


@router.patch("/{appt_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appt_id: int,
    status_update: AppointmentStatusUpdate,
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = status_update.status
    db.commit()
    db.refresh(appt)
    return enrich_appointment(appt)


@router.patch("/{appt_id}/followup", response_model=AppointmentResponse)
def update_followup(
    appt_id: int,
    followup: AppointmentFollowUpUpdate,
    db: Session = Depends(get_db)
):
    """Set or update the follow-up date/notes on an appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.follow_up_date = followup.follow_up_date
    appt.follow_up_notes = followup.follow_up_notes
    db.commit()
    db.refresh(appt)
    return enrich_appointment(appt)


@router.delete("/{appt_id}", status_code=204)
def delete_appointment(appt_id: int, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()
