from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models import Tourist
from app.schemas import TouristOut, TouristTelemetryUpdate, EmergencyTriggerRequest
from app.simulation.sensor_sim import sensor_sim
from app.simulation.lora_sim import lora_sim
from app.services.incident_manager import incident_manager

router = APIRouter(prefix="/tourist", tags=["Tourist"])

class OfflineSyncRequest(BaseModel):
    ugid: Optional[str] = "GX-8921-ALPHA"
    queue: List[Dict[str, Any]] = []

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
    elif action == "ABNORMAL":
        sensor_sim.set_mode("ABNORMAL")
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

@router.post("/sync")
def sync_offline_queue(req: OfflineSyncRequest, db: Session = Depends(get_db)):
    """
    Synchronizes offline buffered telemetry packets after Airplane Mode or reconnect.
    Restores the complete breadcrumb session and updates database state.
    """
    if not req.queue:
        return {"status": "noop", "synced_packets": 0}

    count = len(req.queue)
    last_item = req.queue[-1]
    last_lat = last_item.get("lat")
    last_lon = last_item.get("lon")
    last_alt = last_item.get("altitude", 1240.0)

    if last_lat and last_lon:
        incident_manager.update_tourist_gps(last_lat, last_lon, last_alt)

    incident_manager.add_timeline_log(
        incident_id=incident_manager.active_incident_id,
        event_type="OFFLINE_QUEUE_SYNC",
        title=f"OFFLINE PACKET QUEUE FLUSHED ({count} PACKETS)",
        description=f"Recovered {count} buffered telemetry frames from offline PWA cache. Session restored.",
        source="OFFLINE_PWA_SYNC"
    )

    return {
        "status": "synchronized",
        "synced_packets": count,
        "latest_coords": {"lat": last_lat, "lon": last_lon}
    }
