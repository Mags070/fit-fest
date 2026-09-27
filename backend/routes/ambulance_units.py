from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.ambulance_unit import AmbulanceUnit
from schemas.ambulance_unit import AmbulanceUnitCreate, AmbulanceUnitStatusUpdate, AmbulanceUnitResponse

router = APIRouter(prefix="/api/ambulance/units", tags=["Ambulance Units"])


@router.post("/", response_model=AmbulanceUnitResponse, status_code=201)
def create_unit(unit: AmbulanceUnitCreate, db: Session = Depends(get_db)):
    db_unit = AmbulanceUnit(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.get("/", response_model=List[AmbulanceUnitResponse])
def list_units(
    status: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AmbulanceUnit)
    if status:
        query = query.filter(AmbulanceUnit.status == status)
    if location:
        query = query.filter(AmbulanceUnit.location.ilike(f"%{location}%"))
    return query.order_by(AmbulanceUnit.status, AmbulanceUnit.unit_name).all()


@router.patch("/{unit_id}/status", response_model=AmbulanceUnitResponse)
def update_unit_status(
    unit_id: int,
    update: AmbulanceUnitStatusUpdate,
    db: Session = Depends(get_db)
):
    unit = db.query(AmbulanceUnit).filter(AmbulanceUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    unit.status = update.status
    if update.location:
        unit.location = update.location
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}", status_code=204)
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(AmbulanceUnit).filter(AmbulanceUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
