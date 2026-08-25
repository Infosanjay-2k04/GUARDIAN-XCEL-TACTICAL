from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Tourist
from app.schemas import TouristOut, TouristTelemetryUpdate, EmergencyTriggerRequest
from app.simulation.sensor_sim import sensor_sim
from app.simulation.lora_sim import lora_sim
from app.services.incident_manager import incident_manager

router = APIRouter(prefix="/tourist", tags=["Tourist"])

@router.get("/profile", response_model=TouristOut)
def get_tourist_profile(db: Session = Depends(get_db)):
    tourist = db.query(Tourist).filter(Tourist.ugid == incident_manager.current_tourist_ugid).first()
    if not tourist:
        raise HTTPException(status_code=404, detail="Tourist not found")
    return tourist

@router.post("/sim-action")
def set_simulation_action(action: str):
    """
    Simulates physical tourist behaviors:
    - NORMAL: Normal walk
    - FALL: Hard fall impact
    - IMMOBILE: Inactivity
    - LORA_DROP: Cellular drop -> LoRa fallback
    - SOS: Manual SOS button
    """
    if action == "NORMAL":
        sensor_sim.set_mode("NORMAL_WALK")
        lora_sim.set_channel("CELLULAR_4G")
    elif action == "FALL":
        sensor_sim.set_mode("FALLING")
    elif action == "IMMOBILE":
        sensor_sim.set_mode("IMMOBILE")
    elif action == "LORA_DROP":
        lora_sim.set_channel("LORA_MESH")
    elif action == "SOS":
        sensor_sim.set_mode("MANUAL_SOS")
        incident_manager.trigger_emergency(incident_manager.current_tourist_ugid, "MANUAL_SOS", "Manual Panic Button Triggered by Tourist")
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    return {"status": "ok", "action": action}

@router.post("/emergency")
def report_emergency(req: EmergencyTriggerRequest):
    inc = incident_manager.trigger_emergency(req.ugid, req.trigger_type, req.notes)
    return {"status": "emergency_logged", "incident_id": inc.id, "incident_number": inc.incident_number}
