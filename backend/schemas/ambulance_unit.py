from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AmbulanceUnitCreate(BaseModel):
    unit_name: str = Field(..., min_length=1, max_length=50)
    driver_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=15)
    location: str = Field(..., min_length=1, max_length=100)
    status: str = Field(default="AVAILABLE", pattern="^(AVAILABLE|ON_CALL|UNAVAILABLE)$")
    vehicle_number: Optional[str] = None


class AmbulanceUnitStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(AVAILABLE|ON_CALL|UNAVAILABLE)$")
    location: Optional[str] = None


class AmbulanceUnitResponse(BaseModel):
    id: int
    unit_name: str
    driver_name: str
    phone: str
    location: str
    status: str
    vehicle_number: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
