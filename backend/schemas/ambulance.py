from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AmbulanceCreate(BaseModel):
    patient_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=15)
    location: str = Field(..., min_length=1, max_length=200)
    destination: str = Field(..., min_length=1, max_length=200)
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")


class AmbulanceStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING|ASSIGNED|COMPLETED)$")


class AmbulanceResponse(BaseModel):
    id: int
    patient_name: str
    phone: str
    location: str
    destination: str
    priority: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
