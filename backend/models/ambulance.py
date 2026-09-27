from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class AmbulanceRequest(Base):
    __tablename__ = "ambulance_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    location = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    priority = Column(String, default="MEDIUM")  # LOW | MEDIUM | HIGH
    status = Column(String, default="PENDING")   # PENDING | ASSIGNED | COMPLETED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
