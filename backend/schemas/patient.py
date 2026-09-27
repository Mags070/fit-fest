from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    phone: str = Field(..., min_length=7, max_length=15)
    blood_group: str = Field(..., pattern=r"^(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)$")
    location: str = Field(..., min_length=1, max_length=100)


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    location: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    phone: str
    blood_group: str
    location: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
