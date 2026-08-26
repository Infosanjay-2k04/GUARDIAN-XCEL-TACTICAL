from fastapi import APIRouter
from app.simulation.uav_flight_sim import uav_sim
from app.simulation.thermal_vision_sim import thermal_sim
from app.services.incident_manager import incident_manager

router = APIRouter(prefix="/uav", tags=["UAV"])

@router.get("/status")
def get_uav_status():
    return uav_sim.get_state()

@router.get("/thermal-feed")
def get_thermal_feed():
    uav_state = uav_sim.get_state()
    return thermal_sim.generate_thermal_frame_metadata(
        uav_state["status"], uav_state["target_locked"], uav_state["search_progress_pct"]
    )

@router.post("/set-pattern")
def set_search_pattern(pattern: str = "EXPANDING_SQUARE"):
    uav_sim.search_pattern = pattern
    return {"status": "ok", "search_pattern": pattern}

@router.post("/start-search")
def start_search():
    incident_manager.start_uav_search()
    return {"status": "ok", "command": "START_SEARCH"}

@router.post("/trigger-thermal")
def trigger_thermal():
    incident_manager.trigger_thermal_scan()
    return {"status": "ok", "command": "THERMAL_SCAN"}

@router.post("/return-to-base")
def return_to_base():
    uav_sim.status = "RETURNING"
    return {"status": "ok", "command": "RTL"}

@router.post("/dispatch-active")
def dispatch_active_uav():
    if incident_manager.active_incident_id:
        incident_manager.dispatch_uav(incident_manager.active_incident_id)
        return {"status": "ok", "dispatched_to_incident": incident_manager.active_incident_id}
    else:
        # Standalone launch to default demo tourist coords
        from app.config import settings
        target_lat = settings.DEFAULT_TOURIST_GPS["lat"]
        target_lon = settings.DEFAULT_TOURIST_GPS["lon"]
        uav_sim.dispatch_to_lkp(target_lat, target_lon)
        return {"status": "ok", "dispatched_to_coords": [target_lat, target_lon]}
