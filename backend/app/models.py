import datetime
import hashlib
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Tourist(Base):
    __tablename__ = "tourists"

    id = Column(Integer, primary_key=True, index=True)
    ugid = Column(String(64), unique=True, index=True, nullable=False) # e.g. GX-8921-ALPHA
    full_name = Column(String(128), default="Elena Rostova")
    emergency_contact = Column(String(64), default="+1 (555) 019-2834")
    blood_type = Column(String(8), default="O-POS")
    medical_notes = Column(Text, default="Penicillin Allergy / No Chronic Conditions")
    
    # Live Geolocation
    current_lat = Column(Float, default=37.7420)
    current_lon = Column(Float, default=-119.5975)
    altitude = Column(Float, default=1240.0) # meters
    
    # Telemetry
    battery_pct = Column(Integer, default=94)
    heart_rate = Column(Integer, default=76) # bpm
    accel_x = Column(Float, default=0.02)
    accel_y = Column(Float, default=0.04)
    accel_z = Column(Float, default=0.99)
    g_force = Column(Float, default=1.0)
    
    # Status
    threat_level = Column(String(32), default="NORMAL") # NORMAL, WARNING, CRITICAL
    comms_channel = Column(String(32), default="CELLULAR_4G") # CELLULAR_4G, LORA_MESH, OFFLINE
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    incidents = relationship("Incident", back_populates="tourist")


class UAV(Base):
    __tablename__ = "uavs"

    id = Column(Integer, primary_key=True, index=True)
    callsign = Column(String(32), unique=True, index=True, default="UAV-ALPHA // PHOENIX-1")
    model = Column(String(64), default="Guardian SkyScout V4 (FLIR + RTK)")
    status = Column(String(32), default="STANDBY") # STANDBY, EN_ROUTE_LKP, SEARCHING, TARGET_LOCKED, HOVER_BEACON, RETURNING
    
    # Geolocation & Kinematics
    current_lat = Column(Float, default=37.7490)
    current_lon = Column(Float, default=-119.5860)
    altitude_agl = Column(Float, default=0.0) # Altitude Above Ground Level in meters
    battery_pct = Column(Float, default=98.5)
    airspeed_mps = Column(Float, default=0.0)
    heading_deg = Column(Float, default=0.0)
    
    # Mission parameters
    search_pattern = Column(String(32), default="EXPANDING_SQUARE") # EXPANDING_SQUARE, PARALLEL_SWEEP
    search_progress_pct = Column(Float, default=0.0)
    
    # Target Acquisition
    target_locked = Column(Boolean, default=False)
    target_confidence = Column(Float, default=0.0)
    target_lat = Column(Float, nullable=True)
    target_lon = Column(Float, nullable=True)
    target_thermal_temp = Column(Float, default=0.0)


class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(Integer, primary_key=True, index=True)
    team_callsign = Column(String(32), unique=True, index=True, default="GROUND ECHO-4")
    unit_type = Column(String(64), default="Tactical All-Terrain Rapid Response")
    status = Column(String(32), default="STANDBY") # STANDBY, DISPATCHED, ON_SCENE, RETURNING
    
    current_lat = Column(Float, default=37.7478)
    current_lon = Column(Float, default=-119.5880)
    speed_mps = Column(Float, default=0.0)
    eta_seconds = Column(Integer, default=0)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(32), unique=True, index=True) # e.g. INC-2026-0801
    tourist_id = Column(Integer, ForeignKey("tourists.id"), nullable=False)
    ugid = Column(String(64), index=True, nullable=False)
    
    trigger_type = Column(String(32), default="FALL_DETECTED") # FALL_DETECTED, IMMOBILITY, MANUAL_SOS, GEOFENCE_BREACH
    status = Column(String(32), default="EVALUATING") # EVALUATING, CONFIRMED, UAV_DISPATCHED, TARGET_LOCKED, RESCUE_EN_ROUTE, RESOLVED, CANCELLED
    severity = Column(String(16), default="CRITICAL") # LOW, MEDIUM, HIGH, CRITICAL
    
    # Last Known Position (LKP)
    lkp_lat = Column(Float, nullable=False)
    lkp_lon = Column(Float, nullable=False)
    lkp_altitude = Column(Float, default=1240.0)
    
    # Verified Target Location (From UAV Thermal Lock)
    target_lat = Column(Float, nullable=True)
    target_lon = Column(Float, nullable=True)
    thermal_confidence = Column(Float, default=0.0)
    
    assigned_uav_id = Column(Integer, ForeignKey("uavs.id"), nullable=True)
    assigned_team_id = Column(Integer, ForeignKey("rescue_teams.id"), nullable=True)
    
    notes = Column(Text, default="Automated AI Emergency Pipeline Triggered")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    tourist = relationship("Tourist", back_populates="incidents")
    uav = relationship("UAV", foreign_keys=[assigned_uav_id])
    rescue_team = relationship("RescueTeam", foreign_keys=[assigned_team_id])
    timeline_events = relationship("TimelineEvent", back_populates="incident", order_by="TimelineEvent.timestamp")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String(32)) # SENSOR_ALERT, COMMS_FALLBACK, UAV_LAUNCH, TARGET_DETECT, RESCUE_DISPATCH, RESOLVED
    title = Column(String(128))
    description = Column(Text)
    source = Column(String(32)) # MOBILE_AI, TACTICAL_HUB, UAV_OPS, LORA_MESH, RESCUE_UNIT
    cryptographic_hash = Column(String(64), nullable=True)

    incident = relationship("Incident", back_populates="timeline_events")

    @staticmethod
    def generate_hash(title: str, timestamp_str: str, source: str) -> str:
        payload = f"{title}:{timestamp_str}:{source}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16].upper()
