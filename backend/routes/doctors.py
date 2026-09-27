from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from datetime import datetime, date, timedelta
from database import get_db
from models.doctor import Doctor
from models.appointment import Appointment
from schemas.doctor import (
    DoctorCreate, DoctorUpdate, DoctorResponse,
    DoctorAvailabilityResponse, AvailableDoctorItem, UnavailableDoctorItem
)

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

ALL_DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
DAY_INDEX = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6
}


def format_time_12h(time_str: str) -> str:
    """Converts '10:00' to '10:00 AM' and '14:00' to '2:00 PM'."""
    try:
        t = datetime.strptime(time_str, "%H:%M")
        return t.strftime("%I:%M %p").lstrip("0")
    except Exception:
        return time_str


def is_doctor_working_on_date(available_days: str, target_date: date) -> bool:
    """Checks whether target_date falls within the doctor's available days."""
    target_idx = target_date.weekday()  # Monday=0, Sunday=6
    normalized = available_days.strip().lower()

    if normalized in ["all", "daily", "everyday", "all days", "mon-sun"]:
        return True

    # Range like "Mon-Fri" or "Monday-Saturday"
    if "-" in normalized:
        parts = normalized.split("-")
        if len(parts) == 2:
            s_str = parts[0].strip()
            e_str = parts[1].strip()
            if s_str in DAY_INDEX and e_str in DAY_INDEX:
                s_idx = DAY_INDEX[s_str]
                e_idx = DAY_INDEX[e_str]
                if s_idx <= e_idx:
                    return s_idx <= target_idx <= e_idx
                else:  # wraparound range
                    return target_idx >= s_idx or target_idx <= e_idx

    # Delimited list like "Mon, Wed, Fri"
    delimiters = [",", " ", "/"]
    tokens = [normalized]
    for d in delimiters:
        new_tokens = []
        for t in tokens:
            new_tokens.extend([item.strip() for item in t.split(d) if item.strip()])
        tokens = new_tokens

    for token in tokens:
        if token in DAY_INDEX and DAY_INDEX[token] == target_idx:
            return True

    return False


def check_doctor_availability(
    doctor: Doctor,
    target_date: date,
    target_time: str,
    db: Session
) -> Tuple[bool, Optional[str]]:
    """Evaluates the 5 doctor availability conditions:
    1. Doctor exists (checked by caller).
    2. Doctor status is Available.
    3. Doctor works on the selected day.
    4. Selected time falls within doctor's working hours.
    5. Doctor does not already have a Scheduled appointment at that date & time.
       (Completed and Cancelled appointments do NOT block the slot).
    Returns (True, None) if available, or (False, reason) if unavailable.
    """
    if doctor.status != "Available":
        return False, "Doctor is marked unavailable."

    if not is_doctor_working_on_date(doctor.available_days, target_date):
        return False, "Doctor is not working on this day."

    # Check working hours: start_time <= target_time < end_time
    if not (doctor.start_time <= target_time < doctor.end_time):
        return False, "Outside doctor's working hours."

    # Check conflicting scheduled appointment (only Scheduled blocks availability)
    target_date_str = target_date.isoformat()
    scheduled_appt = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == target_date_str,
        Appointment.appointment_time == target_time,
        Appointment.status == "Scheduled"
    ).first()

    if scheduled_appt:
        return False, "Already booked at this time."

    return True, None


@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    specialization: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Doctor)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    if status:
        query = query.filter(Doctor.status == status)
    return query.order_by(Doctor.name).all()


@router.get("/available", response_model=DoctorAvailabilityResponse)
def get_available_doctors(
    date_str: str = Query(..., alias="date", description="Date YYYY-MM-DD"),
    time_str: str = Query(..., alias="time", description="Time HH:MM"),
    db: Session = Depends(get_db)
):
    """Categorizes all doctors into available and unavailable with clear reasons."""
    # 1. Date validation
    if not date_str or not date_str.strip():
        raise HTTPException(status_code=400, detail="Please select an appointment date.")

    try:
        target_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    if target_date < date.today():
        raise HTTPException(status_code=400, detail="Please select today or a future date.")

    # 2. Time validation
    if not time_str or not time_str.strip():
        raise HTTPException(status_code=400, detail="Please select an appointment time.")

    try:
        # validate HH:MM
        datetime.strptime(time_str.strip(), "%H:%M")
        valid_time_str = time_str.strip()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Expected HH:MM.")

    doctors = db.query(Doctor).all()
    available_list = []
    unavailable_list = []

    for d in doctors:
        hours_display = f"{format_time_12h(d.start_time)} - {format_time_12h(d.end_time)}"
        is_avail, reason = check_doctor_availability(d, target_date, valid_time_str, db)

        if is_avail:
            active_count = db.query(Appointment).filter(
                Appointment.doctor_id == d.id,
                Appointment.appointment_date == date_str,
                Appointment.status == "Scheduled"
            ).count()
            available_list.append(AvailableDoctorItem(
                id=d.id,
                name=d.name,
                specialization=d.specialization,
                phone=d.phone,
                available_days=d.available_days,
                start_time=d.start_time,
                end_time=d.end_time,
                working_hours=hours_display,
                status=d.status,
                available=True,
                appointments_today=active_count
            ))
        else:
            unavailable_list.append(UnavailableDoctorItem(
                id=d.id,
                name=d.name,
                specialization=d.specialization,
                phone=d.phone,
                available_days=d.available_days,
                start_time=d.start_time,
                end_time=d.end_time,
                working_hours=hours_display,
                status=d.status,
                reason=reason or "Unavailable",
                available=False
            ))

    return DoctorAvailabilityResponse(
        date=date_str,
        time=valid_time_str,
        available_doctors=available_list,
        unavailable_doctors=unavailable_list
    )


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.post("/", response_model=DoctorResponse, status_code=201)
def create_doctor(doctor_in: DoctorCreate, db: Session = Depends(get_db)):
    if doctor_in.start_time >= doctor_in.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")
    doctor = Doctor(**doctor_in.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.patch("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, doctor_update: DoctorUpdate, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    update_data = doctor_update.model_dump(exclude_unset=True)
    new_start = update_data.get("start_time", doctor.start_time)
    new_end = update_data.get("end_time", doctor.end_time)
    if new_start >= new_end:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()


@router.get("/{doctor_id}/schedule")
def get_doctor_schedule(
    doctor_id: int,
    date_str: str = Query(..., alias="date", description="Date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Generates 30-minute schedule slots for the doctor on the specified date."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    works_today = is_doctor_working_on_date(doctor.available_days, target_date)

    # Fetch appointments for this doctor on that date (excluding cancelled)
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == date_str,
        Appointment.status != "Cancelled"
    ).all()
    appt_by_time = {a.appointment_time: a for a in appointments}

    # Generate 30-min time slots from start_time to end_time
    try:
        t_curr = datetime.strptime(doctor.start_time, "%H:%M")
        t_end = datetime.strptime(doctor.end_time, "%H:%M")
    except ValueError:
        raise HTTPException(status_code=500, detail="Doctor working hours improperly formatted")

    slots = []
    while t_curr < t_end:
        slot_str = t_curr.strftime("%H:%M")
        if slot_str in appt_by_time:
            appt = appt_by_time[slot_str]
            slots.append({
                "time": slot_str,
                "status": appt.status,
                "patient_name": appt.patient.name if appt.patient else "Patient",
                "patient_id": appt.patient_id,
                "reason": appt.reason,
                "appointment_id": appt.id,
                "available": False
            })
        elif not works_today:
            slots.append({
                "time": slot_str,
                "status": "OFF_DUTY",
                "patient_name": None,
                "available": False
            })
        elif doctor.status != "Available":
            slots.append({
                "time": slot_str,
                "status": "UNAVAILABLE",
                "patient_name": None,
                "available": False
            })
        else:
            slots.append({
                "time": slot_str,
                "status": "AVAILABLE",
                "patient_name": None,
                "available": True
            })

        t_curr += timedelta(minutes=30)

    return {
        "doctor_id": doctor.id,
        "doctor_name": doctor.name,
        "specialization": doctor.specialization,
        "date": date_str,
        "works_today": works_today,
        "doctor_status": doctor.status,
        "slots": slots
    }
