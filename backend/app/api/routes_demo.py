from fastapi import APIRouter
from app.services.incident_manager import incident_manager

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.post("/start")
def start_rescue_demo():
    """Triggers the full automated 10-step rescue demonstration"""
    incident_manager.start_full_rescue_demo()
    return {
        "status": "demo_started",
        "message": "Guardian Xcel automated rescue demonstration initiated."
    }

@router.post("/reset")
def reset_demo():
    """Resets the system back to baseline normal monitoring"""
    incident_manager.reset_system()
    return {
        "status": "system_reset",
        "message": "Guardian Xcel system reset to nominal state."
    }

@router.get("/state")
def get_current_state():
    """Returns instant snapshot of full system state"""
    return incident_manager.get_full_system_state()
