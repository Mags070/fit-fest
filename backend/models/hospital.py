from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Hospital(Base):
    """Nearby hospital / clinic / blood bank information."""
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)               # Hospital | Clinic | Blood Bank | Pharmacy
    address = Column(String, nullable=False)
    location = Column(String, nullable=False)           # Area / city
    phone = Column(String, nullable=False)
    emergency_24h = Column(Boolean, default=False)      # 24-hour emergency?
    speciality = Column(String, nullable=True)          # e.g. "Multispeciality", "Ortho", "Eye"
    distance_km = Column(Float, nullable=True)          # from reference clinic
    created_at = Column(DateTime(timezone=True), server_default=func.now())
