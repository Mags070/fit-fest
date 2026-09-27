from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    appointment_date = Column(String, nullable=False)   # YYYY-MM-DD
    appointment_time = Column(String, nullable=False)   # HH:MM
    reason = Column(String, nullable=False)
    status = Column(String, default="Scheduled")        # Scheduled | Completed | Cancelled
    severity = Column(String, default="ROUTINE")        # ROUTINE | URGENT | CRITICAL
    # Follow-up fields
    follow_up_date = Column(String, nullable=True)      # YYYY-MM-DD or None
    follow_up_notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", backref="appointments")
    doctor = relationship("Doctor", backref="appointments")
