from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    appointment_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    reason: str = Field(..., min_length=1, max_length=300)
    status: str = Field(default="Scheduled", pattern="^(Scheduled|Completed|Cancelled)$")
    severity: str = Field(default="ROUTINE", pattern="^(ROUTINE|URGENT|CRITICAL)$")
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Scheduled|Completed|Cancelled)$")


class AppointmentFollowUpUpdate(BaseModel):
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_date: str
    appointment_time: str
    reason: str
    status: str
    severity: Optional[str] = "ROUTINE"
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_blood_group: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None

    class Config:
        from_attributes = True


class AutoAssignRequest(BaseModel):
    patient_id: Optional[int] = None
    appointment_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    appointment_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    reason: Optional[str] = None


class AutoAssignDoctorInfo(BaseModel):
    id: int
    name: str
    specialization: str
    phone: Optional[str] = None
    working_hours: Optional[str] = None
    available_days: Optional[str] = None
    status: Optional[str] = "Available"

    class Config:
        from_attributes = True


class AutoAssignResponse(BaseModel):
    doctor: AutoAssignDoctorInfo
    appointments_today: int
    reason: str

