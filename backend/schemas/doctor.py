from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    specialization: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=15)
    available_days: str = Field(..., min_length=1, max_length=100)  # e.g. "Mon-Fri", "Mon-Sat"
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    status: str = Field(default="Available", pattern="^(Available|Unavailable)$")


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    available_days: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None


class DoctorResponse(BaseModel):
    id: int
    name: str
    specialization: str
    phone: str
    available_days: str
    start_time: str
    end_time: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DoctorAvailableResponse(BaseModel):
    id: int
    name: str
    specialization: str
    phone: str
    available_days: str
    start_time: str
    end_time: str
    status: str
    available: bool = True

    class Config:
        from_attributes = True
