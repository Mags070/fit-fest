from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class AmbulanceUnit(Base):
    """Represents a physical ambulance unit in the fleet."""
    __tablename__ = "ambulance_units"

    id = Column(Integer, primary_key=True, index=True)
    unit_name = Column(String, nullable=False)          # e.g. "AMB-01"
    driver_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    location = Column(String, nullable=False)           # Current area
    status = Column(String, default="AVAILABLE")        # AVAILABLE | ON_CALL | UNAVAILABLE
    vehicle_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
