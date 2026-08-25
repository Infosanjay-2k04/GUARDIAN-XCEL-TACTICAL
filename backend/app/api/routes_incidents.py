from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Incident
from app.schemas import IncidentOut
from app.services.incident_manager import incident_manager

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/", response_model=List[IncidentOut])
def get_all_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.id.desc()).limit(20).all()

@router.get("/active", response_model=IncidentOut)
def get_active_incident(db: Session = Depends(get_db)):
    if incident_manager.active_incident_id:
        inc = db.query(Incident).filter(Incident.id == incident_manager.active_incident_id).first()
        if inc:
            return inc
    
    inc = db.query(Incident).filter(Incident.status.notin_(["RESOLVED", "CANCELLED"])).order_by(Incident.id.desc()).first()
    if not inc:
        raise HTTPException(status_code=404, detail="No active emergency incidents")
    return inc

@router.post("/{incident_id}/dispatch-uav")
def dispatch_uav(incident_id: int):
    incident_manager.dispatch_uav(incident_id)
    return {"status": "uav_dispatched", "incident_id": incident_id}

@router.post("/{incident_id}/dispatch-rescue")
def dispatch_rescue(incident_id: int):
    incident_manager.dispatch_ground_rescue(incident_id)
    return {"status": "rescue_dispatched", "incident_id": incident_id}

@router.post("/{incident_id}/resolve")
def resolve_incident(incident_id: int):
    incident_manager.resolve_incident(incident_id)
    return {"status": "incident_resolved", "incident_id": incident_id}
