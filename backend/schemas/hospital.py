from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class HospitalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: str = Field(..., pattern="^(Hospital|Clinic|Blood Bank|Pharmacy)$")
    address: str = Field(..., min_length=1, max_length=300)
    location: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=15)
    emergency_24h: bool = False
    speciality: Optional[str] = None
    distance_km: Optional[float] = None


class HospitalResponse(BaseModel):
    id: int
    name: str
    type: str
    address: str
    location: str
    phone: str
    emergency_24h: bool
    speciality: Optional[str] = None
    distance_km: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
