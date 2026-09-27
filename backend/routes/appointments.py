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
    AppointmentFollowUpUpdate, AppointmentResponse
)
from routes.doctors import is_doctor_working_on_date, check_doctor_availability

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
                detail=f"Doctor is no longer available for this time ({reason}). Please select another doctor."
            )

    db_appt = Appointment(**appt.model_dump())
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    db_appt = db.query(Appointment).filter(Appointment.id == db_appt.id).first()
    return enrich_appointment(db_appt)


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
