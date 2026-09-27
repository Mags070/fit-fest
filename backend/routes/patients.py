from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.patient import Patient
from schemas.patient import PatientCreate, PatientUpdate, PatientResponse

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@router.get("/", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%")) |
            (Patient.phone.ilike(f"%{search}%"))
        )
    return query.order_by(Patient.created_at.desc()).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    update_data = patient_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
