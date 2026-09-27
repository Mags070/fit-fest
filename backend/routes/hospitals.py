from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.hospital import Hospital
from schemas.hospital import HospitalCreate, HospitalResponse

router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])


@router.post("/", response_model=HospitalResponse, status_code=201)
def create_hospital(hospital: HospitalCreate, db: Session = Depends(get_db)):
    db_h = Hospital(**hospital.model_dump())
    db.add(db_h)
    db.commit()
    db.refresh(db_h)
    return db_h


@router.get("/", response_model=List[HospitalResponse])
def list_hospitals(
    location: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    emergency_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Hospital)
    if location:
        query = query.filter(Hospital.location.ilike(f"%{location}%"))
    if type:
        query = query.filter(Hospital.type == type)
    if emergency_only:
        query = query.filter(Hospital.emergency_24h == True)
    return query.order_by(Hospital.distance_km.nullslast(), Hospital.name).all()


@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital(hospital_id: int, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return h


@router.delete("/{hospital_id}", status_code=204)
def delete_hospital(hospital_id: int, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    db.delete(h)
    db.commit()
