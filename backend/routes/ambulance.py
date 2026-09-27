from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.ambulance import AmbulanceRequest
from schemas.ambulance import AmbulanceCreate, AmbulanceStatusUpdate, AmbulanceResponse

router = APIRouter(prefix="/api/ambulance", tags=["Ambulance"])


@router.post("/", response_model=AmbulanceResponse, status_code=201)
def create_ambulance_request(req: AmbulanceCreate, db: Session = Depends(get_db)):
    db_req = AmbulanceRequest(**req.model_dump())
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req


@router.get("/", response_model=List[AmbulanceResponse])
def list_ambulance_requests(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AmbulanceRequest)
    if status:
        query = query.filter(AmbulanceRequest.status == status)
    if priority:
        query = query.filter(AmbulanceRequest.priority == priority)
    return query.order_by(AmbulanceRequest.created_at.desc()).all()


@router.get("/{req_id}", response_model=AmbulanceResponse)
def get_ambulance_request(req_id: int, db: Session = Depends(get_db)):
    req = db.query(AmbulanceRequest).filter(AmbulanceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Ambulance request not found")
    return req


@router.patch("/{req_id}/status", response_model=AmbulanceResponse)
def update_ambulance_status(
    req_id: int,
    status_update: AmbulanceStatusUpdate,
    db: Session = Depends(get_db)
):
    req = db.query(AmbulanceRequest).filter(AmbulanceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Ambulance request not found")
    req.status = status_update.status
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{req_id}", status_code=204)
def delete_ambulance_request(req_id: int, db: Session = Depends(get_db)):
    req = db.query(AmbulanceRequest).filter(AmbulanceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Ambulance request not found")
    db.delete(req)
    db.commit()
