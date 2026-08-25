from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class TouristBase(BaseModel):
    ugid: str
    full_name: str
    emergency_contact: str
    blood_type: str
    medical_notes: str
    current_lat: float
    current_lon: float
    altitude: float
    battery_pct: int
    heart_rate: int
    accel_x: float
    accel_y: float
    accel_z: float
    g_force: float
    threat_level: str
    comms_channel: str

class TouristOut(TouristBase):
    id: int
    is_active: bool
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class TouristTelemetryUpdate(BaseModel):
    ugid: str
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None
    altitude: Optional[float] = None
    battery_pct: Optional[int] = None
    heart_rate: Optional[int] = None
    accel_x: Optional[float] = None
    accel_y: Optional[float] = None
    accel_z: Optional[float] = None
    g_force: Optional[float] = None
    threat_level: Optional[str] = None
    comms_channel: Optional[str] = None

class UAVOut(BaseModel):
    id: int
    callsign: str
    model: str
    status: str
    current_lat: float
    current_lon: float
    altitude_agl: float
    battery_pct: float
    airspeed_mps: float
    heading_deg: float
    assigned_incident_id: Optional[int] = None
    search_pattern: str
    search_progress_pct: float
    target_locked: bool
    target_confidence: float
    target_lat: Optional[float] = None
    target_lon: Optional[float] = None
    target_thermal_temp: float

    class Config:
        from_attributes = True

class RescueTeamOut(BaseModel):
    id: int
    team_callsign: str
    unit_type: str
    status: str
    current_lat: float
    current_lon: float
    speed_mps: float
    eta_seconds: int
    assigned_incident_id: Optional[int] = None

    class Config:
        from_attributes = True

class TimelineEventOut(BaseModel):
    id: int
    incident_id: Optional[int] = None
    timestamp: datetime.datetime
    event_type: str
    title: str
    description: str
    source: str
    cryptographic_hash: Optional[str] = None

    class Config:
        from_attributes = True

class IncidentOut(BaseModel):
    id: int
    incident_number: str
    tourist_id: int
    ugid: str
    trigger_type: str
    status: str
    severity: str
    lkp_lat: float
    lkp_lon: float
    lkp_altitude: float
    target_lat: Optional[float] = None
    target_lon: Optional[float] = None
    thermal_confidence: float
    assigned_uav_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    timeline_events: List[TimelineEventOut] = []

    class Config:
        from_attributes = True

class EmergencyTriggerRequest(BaseModel):
    ugid: str
    trigger_type: str = "FALL_DETECTED" # FALL_DETECTED, MANUAL_SOS, IMMOBILITY
    lat: Optional[float] = None
    lon: Optional[float] = None
    g_force: Optional[float] = None
    notes: Optional[str] = None

class SystemStateBroadcast(BaseModel):
    type: str = "STATE_UPDATE"
    timestamp: str
    tourist: Optional[TouristOut] = None
    uav: Optional[UAVOut] = None
    rescue_team: Optional[RescueTeamOut] = None
    active_incident: Optional[IncidentOut] = None
    incidents_list: List[IncidentOut] = []
    timeline_events: List[TimelineEventOut] = []
    demo_step: int = 0
    demo_status_text: str = "IDLE // MONITORING"
