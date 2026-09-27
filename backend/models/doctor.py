from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)               # e.g. "Dr. Priya Sharma"
    specialization = Column(String, nullable=False)     # e.g. "General Physician"
    phone = Column(String, nullable=False)
    available_days = Column(String, nullable=False)     # e.g. "Mon-Fri", "Mon-Sat", "Mon,Tue,Wed,Thu,Fri"
    start_time = Column(String, nullable=False)         # HH:MM e.g. "10:00"
    end_time = Column(String, nullable=False)           # HH:MM e.g. "14:00"
    status = Column(String, default="Available")        # "Available" | "Unavailable"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
