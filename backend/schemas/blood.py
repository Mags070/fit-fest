from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BloodRecordCreate(BaseModel):
    blood_group: str = Field(..., pattern=r"^(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)$")
    location: str = Field(..., min_length=1, max_length=100)
    units_available: int = Field(..., ge=0)
    contact: str = Field(..., min_length=7, max_length=15)
    source_name: str = Field(..., min_length=1, max_length=200)
    status: str = Field(default="AVAILABLE", pattern="^(AVAILABLE|UNAVAILABLE)$")


class BloodRecordResponse(BaseModel):
    id: int
    blood_group: str
    location: str
    units_available: int
    contact: str
    source_name: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
