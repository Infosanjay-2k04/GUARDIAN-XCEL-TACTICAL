import asyncio
import datetime
import time
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import Tourist, UAV, RescueTeam, Incident, TimelineEvent
from app.config import settings
from app.simulation.sensor_sim import sensor_sim
from app.simulation.lora_sim import lora_sim
from app.simulation.uav_flight_sim import uav_sim
from app.simulation.thermal_vision_sim import thermal_sim
from app.simulation.ground_team_sim import rescue_sim
from app.services.alert_dispatcher import dispatcher
from app.services.ugid_service import ugid_service

# Initialize tables
Base.metadata.create_all(bind=engine)

class IncidentManager:
    def __init__(self):
        self.demo_task: Optional[asyncio.Task] = None
        self.sim_loop_task: Optional[asyncio.Task] = None
        self.demo_step: int = 0
        self.demo_status_text: str = "SYSTEM READY // NORMAL MONITORING"
        self.active_incident_id: Optional[int] = None
        self.current_tourist_ugid: str = "GX-8921-ALPHA"
        self._ensure_initial_data()

    def _ensure_initial_data(self):
        """Seeds initial default Tourist, UAV, and Rescue Team entities if DB is fresh"""
        db: Session = SessionLocal()
        try:
            # Seed multiple tourists
            tourists_seed = [
                {
                    "ugid": "GX-8921-ALPHA",
                    "full_name": "Elena Rostova",
                    "emergency_contact": "+1 (555) 019-2834",
                    "blood_type": "O-POS",
                    "medical_notes": "Penicillin Allergy / No Chronic Conditions",
                    "current_lat": 37.7420,
                    "current_lon": -119.5975,
                    "altitude": 1240.0,
                    "battery_pct": 94,
                    "heart_rate": 76,
                    "threat_level": "NORMAL",
                    "comms_channel": "CELLULAR_4G"
                },
                {
                    "ugid": "GX-4412-BRAVO",
                    "full_name": "Marcus Vance",
                    "emergency_contact": "+1 (555) 304-9821",
                    "blood_type": "A-POS",
                    "medical_notes": "Asthma (Inhaler equipped)",
                    "current_lat": 37.7510,
                    "current_lon": -119.5890,
                    "altitude": 1410.0,
                    "battery_pct": 88,
                    "heart_rate": 72,
                    "threat_level": "NORMAL",
                    "comms_channel": "CELLULAR_4G"
                },
                {
                    "ugid": "GX-1109-DELTA",
                    "full_name": "Sarah Lin",
                    "emergency_contact": "+1 (555) 672-1140",
                    "blood_type": "B-POS",
                    "medical_notes": "Nil Notable / Experienced Hiker",
                    "current_lat": 37.7465,
                    "current_lon": -119.6015,
                    "altitude": 1180.0,
                    "battery_pct": 91,
                    "heart_rate": 74,
                    "threat_level": "NORMAL",
                    "comms_channel": "CELLULAR_4G"
                },
                {
                    "ugid": "GX-7723-SIERRA",
                    "full_name": "David Kim",
                    "emergency_contact": "+1 (555) 918-4422",
                    "blood_type": "O-NEG",
                    "medical_notes": "Type 1 Diabetes (Insulin Carrier)",
                    "current_lat": 37.7395,
                    "current_lon": -119.5840,
                    "altitude": 1320.0,
                    "battery_pct": 79,
                    "heart_rate": 80,
                    "threat_level": "NORMAL",
                    "comms_channel": "CELLULAR_4G"
                }
            ]

            for t_data in tourists_seed:
                exists = db.query(Tourist).filter(Tourist.ugid == t_data["ugid"]).first()
                if not exists:
                    tourist = Tourist(**t_data)
                    db.add(tourist)

            # Seed UAVs
            uav = db.query(UAV).first()
            if not uav:
                uav1 = UAV(
                    callsign="UAV-ALPHA // PHOENIX-1",
                    model="Guardian SkyScout V4 (FLIR + RTK)",
                    status="STANDBY",
                    current_lat=settings.UAV_HANGAR_GPS["lat"],
                    current_lon=settings.UAV_HANGAR_GPS["lon"],
                    altitude_agl=0.0,
                    battery_pct=98.5
                )
                db.add(uav1)

            # Seed Ground Team
            team = db.query(RescueTeam).first()
            if not team:
                team = RescueTeam(
                    team_callsign="GROUND ECHO-4",
                    unit_type="Tactical All-Terrain Rapid Response",
                    status="STANDBY",
                    current_lat=settings.RESCUE_STATION_GPS["lat"],
                    current_lon=settings.RESCUE_STATION_GPS["lon"]
                )
                db.add(team)

            db.commit()
        finally:
            db.close()

    def start_background_loop(self):
        """Starts the central asynchronous simulation tick loop"""
        if self.sim_loop_task is None or self.sim_loop_task.done():
            self.sim_loop_task = asyncio.create_task(self._simulation_loop())

    async def _simulation_loop(self):
        """Runs at 5Hz to update kinematics, sensor streams, and broadcast state to all WebSocket clients"""
        dt = 0.2
        while True:
            try:
                # 1. Tick simulation engines
                sensor_data = sensor_sim.tick()
                lora_data = lora_sim.tick()
                uav_sim.tick(dt)
                rescue_sim.tick(dt)
                
                # Check for autonomous transitions during live mission
                if uav_sim.status == "TARGET_LOCKED" and self.active_incident_id is not None:
                    db: Session = SessionLocal()
                    try:
                        inc = db.query(Incident).filter(Incident.id == self.active_incident_id).first()
                        if inc and inc.status == "UAV_DISPATCHED":
                            inc.status = "TARGET_LOCKED"
                            inc.target_lat = uav_sim.target_lat
                            inc.target_lon = uav_sim.target_lon
                            inc.thermal_confidence = uav_sim.target_confidence
                            
                            # Add timeline log
                            now_time = datetime.datetime.now().strftime("%H:%M:%S")
                            event = TimelineEvent(
                                incident_id=inc.id,
                                event_type="TARGET_DETECT",
                                title=f"{now_time} — Victim located via FLIR (36.8°C)",
                                description=f"Human body heat signature locked at {inc.target_lat:.5f}, {inc.target_lon:.5f}. Confidence: {uav_sim.target_confidence}%.",
                                source="UAV_OPS",
                                cryptographic_hash=TimelineEvent.generate_hash("UAV FLIR Lock", str(datetime.datetime.utcnow()), "UAV_OPS")
                            )
                            db.add(event)
                            db.commit()
                    finally:
                        db.close()

                # Check for ground rescue arrival
                if rescue_sim.status == "ON_SCENE" and self.active_incident_id is not None:
                    db: Session = SessionLocal()
                    try:
                        inc = db.query(Incident).filter(Incident.id == self.active_incident_id).first()
                        if inc and inc.status == "RESCUE_EN_ROUTE":
                            inc.status = "ON_SCENE"
                            now_time = datetime.datetime.now().strftime("%H:%M:%S")
                            event = TimelineEvent(
                                incident_id=inc.id,
                                event_type="ON_SCENE",
                                title=f"{now_time} — Ground rescue team on scene",
                                description="Echo-4 tactical unit has reached victim coordinates. First aid and stabilization initiated.",
                                source="RESCUE_UNIT",
                                cryptographic_hash=TimelineEvent.generate_hash("Ground Arrived", str(datetime.datetime.utcnow()), "RESCUE_UNIT")
                            )
                            db.add(event)
                            db.commit()
                    finally:
                        db.close()

                # 2. Build full state packet & broadcast
                state_packet = self.get_full_system_state(sensor_data, lora_data)
                await dispatcher.broadcast(state_packet)

            except Exception as e:
                print(f"[SimulationLoop Error] {e}")

            await asyncio.sleep(dt)

    def get_full_system_state(self, sensor_data: dict = None, lora_data: dict = None) -> dict:
        """Retrieves and packages current state from database and simulation modules"""
        if sensor_data is None:
            sensor_data = sensor_sim.tick()
        if lora_data is None:
            lora_data = lora_sim.tick()

        uav_state = uav_sim.get_state()
        rescue_state = rescue_sim.get_state()
        thermal_metadata = thermal_sim.generate_thermal_frame_metadata(
            uav_state["status"], uav_state["target_locked"], uav_state["search_progress_pct"]
        )

        db: Session = SessionLocal()
        try:
            tourist = db.query(Tourist).filter(Tourist.ugid == self.current_tourist_ugid).first()
            active_inc = None
            if self.active_incident_id:
                active_inc = db.query(Incident).filter(Incident.id == self.active_incident_id).first()
            elif tourist:
                active_inc = db.query(Incident).filter(
                    Incident.tourist_id == tourist.id,
                    Incident.status != "RESOLVED",
                    Incident.status != "CANCELLED"
                ).order_by(Incident.id.desc()).first()

            all_tourists_db = db.query(Tourist).all()
            all_incidents = db.query(Incident).order_by(Incident.id.desc()).limit(10).all()
            events = db.query(TimelineEvent).order_by(TimelineEvent.id.desc()).limit(20).all()

            # Pack primary demo tourist
            tourist_dict = {
                "id": tourist.id if tourist else 1,
                "ugid": self.current_tourist_ugid,
                "full_name": tourist.full_name if tourist else "Elena Rostova",
                "emergency_contact": tourist.emergency_contact if tourist else "+1 (555) 019-2834",
                "blood_type": tourist.blood_type if tourist else "O-POS",
                "medical_notes": tourist.medical_notes if tourist else "Penicillin Allergy",
                "current_lat": tourist.current_lat if tourist else settings.DEFAULT_TOURIST_GPS["lat"],
                "current_lon": tourist.current_lon if tourist else settings.DEFAULT_TOURIST_GPS["lon"],
                "altitude": 1240.0,
                "battery_pct": sensor_data["battery_pct"],
                "heart_rate": sensor_data["heart_rate"],
                "accel_x": sensor_data["accel_x"],
                "accel_y": sensor_data["accel_y"],
                "accel_z": sensor_data["accel_z"],
                "g_force": sensor_data["g_force"],
                "threat_level": sensor_data["threat_level"],
                "comms_channel": lora_data["channel"],
                "step_counter": sensor_data.get("step_counter", 4120),
                "is_active": True
            }

            # Pack full list of monitored tourists
            tourists_list = []
            safe_count = 0
            at_risk_count = 0
            emergency_count = 0

            for t in all_tourists_db:
                # If it's the active demo tourist, inject live simulation sensor state
                if t.ugid == self.current_tourist_ugid:
                    cur_threat = sensor_data["threat_level"]
                    cur_battery = sensor_data["battery_pct"]
                    cur_hr = sensor_data["heart_rate"]
                    cur_g = sensor_data["g_force"]
                    cur_comms = lora_data["channel"]
                else:
                    cur_threat = t.threat_level
                    cur_battery = t.battery_pct
                    cur_hr = t.heart_rate
                    cur_g = t.g_force
                    cur_comms = t.comms_channel

                if cur_threat == "CRITICAL":
                    emergency_count += 1
                elif cur_threat == "WARNING":
                    at_risk_count += 1
                else:
                    safe_count += 1

                tourists_list.append({
                    "id": t.id,
                    "ugid": t.ugid,
                    "full_name": t.full_name,
                    "emergency_contact": t.emergency_contact,
                    "blood_type": t.blood_type,
                    "medical_notes": t.medical_notes,
                    "current_lat": t.current_lat,
                    "current_lon": t.current_lon,
                    "altitude": t.altitude,
                    "battery_pct": cur_battery,
                    "heart_rate": cur_hr,
                    "g_force": cur_g,
                    "threat_level": cur_threat,
                    "comms_channel": cur_comms
                })

            # Drone Fleet Data (3 drones)
            uav_fleet = [
                {
                    "drone_id": "DRONE-01",
                    "callsign": uav_state["callsign"],
                    "model": "Guardian SkyScout V4 (FLIR + RTK)",
                    "role": "PRIMARY TACTICAL SAR",
                    "status": uav_state["status"],
                    "battery_pct": uav_state["battery_pct"],
                    "voltage": round(22.2 + (uav_state["battery_pct"] / 100.0) * 3.0, 1),
                    "current_lat": uav_state["current_lat"],
                    "current_lon": uav_state["current_lon"],
                    "altitude_agl": uav_state["altitude_agl"],
                    "airspeed_mps": uav_state["airspeed_mps"],
                    "heading_deg": uav_state["heading_deg"],
                    "signal_rssi_dbm": -54,
                    "signal_pct": 98,
                    "mission": "INC-2026-0801 // SAR PATROL" if self.active_incident_id else "AREA PATROL (PAD 01)",
                    "target_locked": uav_state["target_locked"],
                    "target_confidence": uav_state["target_confidence"]
                },
                {
                    "drone_id": "DRONE-02",
                    "callsign": "UAV-BRAVO // VALKYRIE-2",
                    "model": "SkyScout RelayNode (LoRa Mesh Air)",
                    "role": "LORA MESH AERIAL RELAY",
                    "status": "STANDBY",
                    "battery_pct": 94.0,
                    "voltage": 24.1,
                    "current_lat": 37.7492,
                    "current_lon": -119.5855,
                    "altitude_agl": 0.0,
                    "airspeed_mps": 0.0,
                    "heading_deg": 0.0,
                    "signal_rssi_dbm": -48,
                    "signal_pct": 99,
                    "mission": "COMMS RELAY STANDBY (PAD 02)",
                    "target_locked": False,
                    "target_confidence": 0.0
                },
                {
                    "drone_id": "DRONE-03",
                    "callsign": "UAV-CHARLIE // SKYWATCH-3",
                    "model": "HeavyLifter SAR (Thermal Zoom 10x)",
                    "role": "LONG-RANGE THERMAL SCOUT",
                    "status": "STANDBY",
                    "battery_pct": 100.0,
                    "voltage": 25.2,
                    "current_lat": 37.7488,
                    "current_lon": -119.5865,
                    "altitude_agl": 0.0,
                    "airspeed_mps": 0.0,
                    "heading_deg": 0.0,
                    "signal_rssi_dbm": -42,
                    "signal_pct": 100,
                    "mission": "RESERVE FLEET (PAD 03)",
                    "target_locked": False,
                    "target_confidence": 0.0
                }
            ]

            active_inc_dict = None
            if active_inc:
                active_inc_dict = {
                    "id": active_inc.id,
                    "incident_number": active_inc.incident_number,
                    "ugid": active_inc.ugid,
                    "trigger_type": active_inc.trigger_type,
                    "status": active_inc.status,
                    "severity": active_inc.severity,
                    "threat_level": active_inc.severity,
                    "lkp_lat": active_inc.lkp_lat,
                    "lkp_lon": active_inc.lkp_lon,
                    "lkp_altitude": active_inc.lkp_altitude,
                    "target_lat": active_inc.target_lat,
                    "target_lon": active_inc.target_lon,
                    "thermal_confidence": active_inc.thermal_confidence,
                    "created_at": active_inc.created_at.strftime("%H:%M:%S") if active_inc.created_at else None,
                    "assigned_uav": "UAV-ALPHA // PHOENIX-1",
                    "assigned_team": "GROUND ECHO-4",
                    "comms_channel": lora_data["channel"]
                }

            events_list = [
                {
                    "id": ev.id,
                    "incident_id": ev.incident_id,
                    "timestamp": ev.timestamp.strftime("%H:%M:%S"),
                    "event_type": ev.event_type,
                    "title": ev.title,
                    "description": ev.description,
                    "source": ev.source,
                    "cryptographic_hash": ev.cryptographic_hash
                }
                for ev in events
            ]

            return {
                "type": "STATE_UPDATE",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "tourist": tourist_dict,
                "tourists_list": tourists_list,
                "tourist_stats": {
                    "total": len(tourists_list),
                    "safe": safe_count,
                    "at_risk": at_risk_count,
                    "emergency": emergency_count
                },
                "uav": uav_state,
                "uav_fleet": uav_fleet,
                "rescue_team": rescue_state,
                "thermal_vision": thermal_metadata,
                "comms": lora_data,
                "active_incident": active_inc_dict,
                "recent_events": events_list,
                "demo_step": self.demo_step,
                "demo_status_text": self.demo_status_text,
                "geofence_safe": settings.GEOFENCE_SAFE_ZONE,
                "geofence_hazard": settings.GEOFENCE_HAZARD_ZONE,
                "landmarks": {
                    "ranger_hq": settings.RANGER_STATION_GPS,
                    "uav_hangar": settings.UAV_HANGAR_GPS,
                    "rescue_station": settings.RESCUE_STATION_GPS
                }
            }
        finally:
            db.close()

    def add_timeline_log(self, incident_id: Optional[int], event_type: str, title: str, description: str, source: str = "TACTICAL_HUB"):
        """Creates a timestamped cryptographic log entry"""
        db: Session = SessionLocal()
        try:
            now_str = str(datetime.datetime.utcnow())
            ev = TimelineEvent(
                incident_id=incident_id,
                event_type=event_type,
                title=title,
                description=description,
                source=source,
                cryptographic_hash=TimelineEvent.generate_hash(title, now_str, source)
            )
            db.add(ev)
            db.commit()
        finally:
            db.close()

    def trigger_emergency(self, ugid: str, trigger_type: str = "FALL_DETECTED", notes: str = None) -> Incident:
        """Generates an emergency incident in database and triggers downstream triage"""
        db: Session = SessionLocal()
        try:
            tourist = db.query(Tourist).filter(Tourist.ugid == ugid).first()
            if not tourist:
                tourist = Tourist(ugid=ugid)
                db.add(tourist)
                db.commit()
                db.refresh(tourist)

            inc_count = db.query(Incident).count() + 101
            inc_num = f"INC-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{inc_count}"
            incident = Incident(
                incident_number=inc_num,
                tourist_id=tourist.id,
                ugid=ugid,
                trigger_type=trigger_type,
                status="CONFIRMED",
                severity="CRITICAL",
                lkp_lat=tourist.current_lat,
                lkp_lon=tourist.current_lon,
                lkp_altitude=tourist.altitude,
                notes=notes or "Emergency triggered via Guardian Xcel Mobile AI"
            )
            db.add(incident)
            db.commit()
            db.refresh(incident)

            self.active_incident_id = incident.id

            # Add structured timeline logs matching the exact competition sequence
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            ev1 = TimelineEvent(
                incident_id=incident.id,
                event_type="SENSOR_ALERT",
                title=f"{now_time} — Impact detected (3.8g)",
                description=f"Sensor registered abnormal impact spike on UGID {ugid}.",
                source="MOBILE_AI",
                cryptographic_hash=TimelineEvent.generate_hash("Impact detected", str(datetime.datetime.utcnow()), "MOBILE_AI")
            )
            ev2 = TimelineEvent(
                incident_id=incident.id,
                event_type="IMMOBILITY",
                title=f"{now_time} — Inactivity confirmed",
                description="Zero motion sustained for safety threshold. Auto-distress generated.",
                source="MOBILE_AI",
                cryptographic_hash=TimelineEvent.generate_hash("Inactivity confirmed", str(datetime.datetime.utcnow()), "MOBILE_AI")
            )
            ev3 = TimelineEvent(
                incident_id=incident.id,
                event_type="EMERGENCY_CREATED",
                title=f"{now_time} — Emergency created ({inc_num})",
                description=f"Incident opened for UGID {ugid}. Last Known Position (LKP) locked.",
                source="TACTICAL_HUB",
                cryptographic_hash=TimelineEvent.generate_hash("Emergency created", str(datetime.datetime.utcnow()), "TACTICAL_HUB")
            )
            ev4 = TimelineEvent(
                incident_id=incident.id,
                event_type="UGID_VERIFIED",
                title=f"{now_time} — UGID verified: {ugid}",
                description="Hiker identity, medical records, and emergency contacts retrieved.",
                source="TACTICAL_HUB",
                cryptographic_hash=TimelineEvent.generate_hash("UGID verified", str(datetime.datetime.utcnow()), "TACTICAL_HUB")
            )
            ev5 = TimelineEvent(
                incident_id=incident.id,
                event_type="COMMS_FALLBACK",
                title=f"{now_time} — LoRa 868MHz failover active",
                description="Cellular signal loss simulated (-124 dBm). Switched to 24-byte LoRa mesh.",
                source="LORA_MESH",
                cryptographic_hash=TimelineEvent.generate_hash("LoRa Failover", str(datetime.datetime.utcnow()), "LORA_MESH")
            )
            db.add_all([ev1, ev2, ev3, ev4, ev5])
            db.commit()
            db.refresh(incident)
            db.expunge(incident)

            return incident
        finally:
            db.close()

    def dispatch_uav(self, incident_id: int):
        """Dispatches UAV-Alpha to LKP coordinates"""
        db: Session = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if inc:
                inc.status = "UAV_DISPATCHED"
                uav_sim.dispatch_to_lkp(inc.lkp_lat, inc.lkp_lon)
                
                now_time = datetime.datetime.now().strftime("%H:%M:%S")
                event1 = TimelineEvent(
                    incident_id=inc.id,
                    event_type="UAV_SELECT",
                    title=f"{now_time} — UAV-Alpha (Phoenix-1) selected",
                    description="Nearest available tactical drone assigned to emergency sector.",
                    source="TACTICAL_HUB",
                    cryptographic_hash=TimelineEvent.generate_hash("UAV selected", str(datetime.datetime.utcnow()), "TACTICAL_HUB")
                )
                event2 = TimelineEvent(
                    incident_id=inc.id,
                    event_type="UAV_LAUNCH",
                    title=f"{now_time} — UAV dispatched to LKP",
                    description=f"Drone airborne (24 m/s, 45m AGL). Vectoring to {inc.lkp_lat:.5f}, {inc.lkp_lon:.5f}.",
                    source="UAV_OPS",
                    cryptographic_hash=TimelineEvent.generate_hash("UAV Scramble", str(datetime.datetime.utcnow()), "UAV_OPS")
                )
                db.add_all([event1, event2])
                db.commit()
        finally:
            db.close()

    def start_uav_search(self):
        """Forces UAV into active expanding search pattern"""
        uav_sim.status = "SEARCHING"
        uav_sim.search_start_time = time.time()
        now_time = datetime.datetime.now().strftime("%H:%M:%S")
        self.add_timeline_log(self.active_incident_id, "SEARCH_INITIATED", f"{now_time} — Search initiated", "Expanding square search pattern commenced.", "UAV_OPS")

    def trigger_thermal_scan(self):
        """Forces immediate thermal target lock"""
        uav_sim.target_locked = True
        uav_sim.status = "TARGET_LOCKED"
        uav_sim.target_confidence = 97.6
        if uav_sim.target_lkp_lat:
            uav_sim.target_lat = round(uav_sim.target_lkp_lat + 0.00012, 6)
            uav_sim.target_lon = round(uav_sim.target_lkp_lon - 0.00008, 6)
        uav_sim.target_thermal_temp = 36.8

    def dispatch_ground_rescue(self, incident_id: int):
        """Dispatches Ground Rescue Team to target coordinates"""
        db: Session = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            target_lat = inc.target_lat if (inc and inc.target_lat) else (uav_sim.target_lat or settings.DEFAULT_TOURIST_GPS["lat"])
            target_lon = inc.target_lon if (inc and inc.target_lon) else (uav_sim.target_lon or settings.DEFAULT_TOURIST_GPS["lon"])

            if inc:
                inc.status = "RESCUE_EN_ROUTE"
                inc.target_lat = target_lat
                inc.target_lon = target_lon

            rescue_sim.dispatch_to_target(target_lat, target_lon)
            
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            event = TimelineEvent(
                incident_id=inc.id if inc else None,
                event_type="RESCUE_DISPATCH",
                title=f"{now_time} — Rescue team dispatched",
                description=f"Ground tactical unit Echo-4 rolling to target. Initial ETA: {rescue_sim.eta_seconds}s.",
                source="TACTICAL_HUB",
                cryptographic_hash=TimelineEvent.generate_hash("Rescue Dispatched", str(datetime.datetime.utcnow()), "TACTICAL_HUB")
            )
            db.add(event)
            db.commit()
        finally:
            db.close()

    def resolve_incident(self, incident_id: int):
        """Marks active incident as resolved and returns fleet and sensors to normal"""
        db: Session = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if inc:
                inc.status = "RESOLVED"
                inc.resolved_at = datetime.datetime.utcnow()
                
                now_time = datetime.datetime.now().strftime("%H:%M:%S")
                event = TimelineEvent(
                    incident_id=inc.id,
                    event_type="RESOLVED",
                    title=f"{now_time} — Victim secured // Incident resolved",
                    description="Tourist secured by Echo-4 team. Vitals stabilized. UAV returning to Pad 01.",
                    source="TACTICAL_HUB",
                    cryptographic_hash=TimelineEvent.generate_hash("Incident Resolved", str(datetime.datetime.utcnow()), "TACTICAL_HUB")
                )
                db.add(event)
                db.commit()

            # Reset modules to normal
            sensor_sim.set_mode("NORMAL_WALK")
            lora_sim.set_channel("CELLULAR_4G")
            uav_sim.status = "RETURNING"
            rescue_sim.status = "STANDBY"
            self.demo_step = 10
            self.demo_status_text = "RESCUE COMPLETE // INCIDENT RESOLVED"
            self.active_incident_id = None
        finally:
            db.close()

    def reset_system(self):
        """Resets the complete system state to initial baseline"""
        if self.demo_task and not self.demo_task.done():
            self.demo_task.cancel()

        sensor_sim.set_mode("NORMAL_WALK")
        lora_sim.set_channel("CELLULAR_4G")
        uav_sim.reset_to_base()
        rescue_sim.reset_to_base()
        self.active_incident_id = None
        self.demo_step = 0
        self.demo_status_text = "SYSTEM READY // NORMAL MONITORING"

    def start_full_rescue_demo(self):
        """Launches the 10-step automated competition demonstration routine"""
        if self.demo_task and not self.demo_task.done():
            self.demo_task.cancel()
        self.demo_task = asyncio.create_task(self._execute_demo_routine())

    async def _execute_demo_routine(self):
        """Executes the full automated 10-step rescue scenario with realistic timing"""
        try:
            # Step 1: Normal Tourist
            self.reset_system()
            self.demo_step = 1
            self.demo_status_text = "STEP 1/10: TOURIST NORMAL // GAIT TELEMETRY STREAMING"
            sensor_sim.set_mode("NORMAL_WALK")
            lora_sim.set_channel("CELLULAR_4G")
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(None, "NORMAL_STATE", f"{now_time} — Baseline telemetry streaming // Normal gait", "All 4 tourist beacons reporting nominal GPS & biometric streams.", "MOBILE_AI")
            await asyncio.sleep(3.5)

            # Step 2: Abnormal Movement / Fall Detected
            self.demo_step = 2
            self.demo_status_text = "STEP 2/10: SUDDEN IMPACT (3.8G) DETECTED // EVALUATING"
            sensor_sim.set_mode("FALLING")
            await asyncio.sleep(2.5)

            # Step 3: Inactivity Confirmed & Threat Level Escalation
            self.demo_step = 3
            self.demo_status_text = "STEP 3/10: SUSTAINED IMMOBILITY CONFIRMED // AUTO-EMERGENCY TRIGGERED"
            sensor_sim.set_mode("IMMOBILE")
            await asyncio.sleep(2.5)

            # Step 4: UGID Verification & LoRa Fallback
            self.demo_step = 4
            self.demo_status_text = "STEP 4/10: UGID VERIFIED // CELLULAR LOSS -> LORA MESH SWITCH"
            lora_sim.set_channel("LORA_MESH")
            inc = self.trigger_emergency(self.current_tourist_ugid, "FALL_DETECTED", "Automated AI Fall & Immobility Trigger")
            await asyncio.sleep(3.0)

            # Step 5: Tactical Hub Triage & Nearest UAV Selection
            self.demo_step = 5
            self.demo_status_text = "STEP 5/10: TACTICAL HUB TRIAGE // UAV-ALPHA SCRAMBLED"
            self.dispatch_uav(inc.id)
            await asyncio.sleep(3.0)

            # Step 6: UAV En Route to LKP
            self.demo_step = 6
            self.demo_status_text = "STEP 6/10: UAV-ALPHA EN ROUTE TO LKP (24 M/S, 45M AGL)"
            while uav_sim.status == "EN_ROUTE_LKP":
                await asyncio.sleep(0.5)

            # Step 7: Systematic Search Pattern & FLIR Thermal Scan
            self.demo_step = 7
            self.demo_status_text = "STEP 7/10: EXPANDING SEARCH PATTERN // FLIR THERMAL SCAN ACTIVE"
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(inc.id, "LKP_REACHED", f"{now_time} — LKP reached", f"UAV arrived at {inc.lkp_lat:.5f}, {inc.lkp_lon:.5f}. Sector search initiated.", "UAV_OPS")
            self.add_timeline_log(inc.id, "SEARCH_START", f"{now_time} — Search initiated", "Expanding square pattern active. FLIR Ironbow sensor streaming at 30 FPS.", "UAV_OPS")
            
            while uav_sim.status == "SEARCHING":
                await asyncio.sleep(0.5)

            # Step 8: Victim AI Target Acquisition & Target Lock
            self.demo_step = 8
            self.demo_status_text = "STEP 8/10: THERMAL CANDIDATE DETECTED // VICTIM LOCATED (36.8°C)"
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(inc.id, "THERMAL_CANDIDATE", f"{now_time} — Thermal candidate detected", "Thermal heat anomaly matches human signature (36.8°C).", "UAV_OPS")
            await asyncio.sleep(2.5)

            # Step 9: Ground Rescue Team Dispatch & Mobile Notification
            self.demo_step = 9
            self.demo_status_text = "STEP 9/10: GROUND RESCUE ECHO-4 DISPATCHED // MOBILE UPDATED"
            self.dispatch_ground_rescue(inc.id)
            while rescue_sim.status == "DISPATCHED":
                await asyncio.sleep(0.5)

            # Brief pause on scene for medical triage
            await asyncio.sleep(2.5)

            # Step 10: Rescue Completed & Incident Resolved
            self.demo_step = 10
            self.demo_status_text = "STEP 10/10: VICTIM SECURED // INCIDENT RESOLVED // DEMO COMPLETE"
            self.resolve_incident(inc.id)

        except asyncio.CancelledError:
            print("[Demo Routine] Cancelled by user/reset.")
        except Exception as e:
            print(f"[Demo Routine Error] {e}")

incident_manager = IncidentManager()
