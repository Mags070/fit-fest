from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class BloodRecord(Base):
    __tablename__ = "blood_records"

    id = Column(Integer, primary_key=True, index=True)
    blood_group = Column(String, nullable=False)
    location = Column(String, nullable=False)
    units_available = Column(Integer, default=0)
    contact = Column(String, nullable=False)
    source_name = Column(String, nullable=False)   # e.g. "City Blood Bank"
    status = Column(String, default="AVAILABLE")   # AVAILABLE | UNAVAILABLE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
