from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.blood import BloodRecord
from schemas.blood import BloodRecordCreate, BloodRecordResponse

router = APIRouter(prefix="/api/blood", tags=["Blood"])


@router.post("/", response_model=BloodRecordResponse, status_code=201)
def create_blood_record(record: BloodRecordCreate, db: Session = Depends(get_db)):
    db_record = BloodRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/", response_model=List[BloodRecordResponse])
def search_blood(
    group: Optional[str] = Query(None, description="Blood group e.g. B+"),
    location: Optional[str] = Query(None, description="Location/city"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(BloodRecord)
    if group:
        query = query.filter(BloodRecord.blood_group == group)
    if location:
        query = query.filter(BloodRecord.location.ilike(f"%{location}%"))
    if status:
        query = query.filter(BloodRecord.status == status)
    return query.order_by(BloodRecord.units_available.desc()).all()


@router.get("/{record_id}", response_model=BloodRecordResponse)
def get_blood_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(BloodRecord).filter(BloodRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Blood record not found")
    return record


@router.patch("/{record_id}", response_model=BloodRecordResponse)
def update_blood_record(record_id: int, record_update: BloodRecordCreate, db: Session = Depends(get_db)):
    record = db.query(BloodRecord).filter(BloodRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Blood record not found")
    for field, value in record_update.model_dump().items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_blood_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(BloodRecord).filter(BloodRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Blood record not found")
    db.delete(record)
    db.commit()
