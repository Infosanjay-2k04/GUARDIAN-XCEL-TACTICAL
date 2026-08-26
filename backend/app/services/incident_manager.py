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
from app.services.alert_dispatcher import dispatcher, departmental_engine, telegram_notifier
from app.services.ugid_service import ugid_service, forensic_ledger

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
                    "current_lat": 11.3995,
                    "current_lon": 78.1614,
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
                    "current_lat": 11.4010,
                    "current_lon": 78.1645,
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
                    "current_lat": 11.3970,
                    "current_lon": 78.1585,
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
                    "current_lat": 11.3960,
                    "current_lon": 78.1630,
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

                            # Auto-dispatch ground rescue unit on thermal acquisition
                            if rescue_sim.status == "STANDBY":
                                self.dispatch_ground_rescue(inc.id)
                    finally:
                        db.close()

                # Check for ground rescue arrival and victim secured handoff
                if rescue_sim.status in ["ON_SCENE", "VICTIM_SECURED"] and self.active_incident_id is not None:
                    db: Session = SessionLocal()
                    try:
                        inc = db.query(Incident).filter(Incident.id == self.active_incident_id).first()
                        if inc and inc.status in ["RESCUE_EN_ROUTE", "TARGET_LOCKED"]:
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
                        elif inc and rescue_sim.status == "VICTIM_SECURED" and inc.status == "ON_SCENE":
                            inc.status = "VICTIM_SECURED"
                            now_time = datetime.datetime.now().strftime("%H:%M:%S")
                            event = TimelineEvent(
                                incident_id=inc.id,
                                event_type="VICTIM_SECURED",
                                title=f"{now_time} — Victim Secured // Triage Active",
                                description="Victim vitals stabilized by Echo-4 medical specialists. Field triage active.",
                                source="RESCUE_UNIT",
                                cryptographic_hash=TimelineEvent.generate_hash("Victim Secured", str(datetime.datetime.utcnow()), "RESCUE_UNIT")
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
                # If it's the active demo tourist, inject live simulation sensor state and exact live coordinates
                if t.ugid == self.current_tourist_ugid:
                    cur_threat = sensor_data["threat_level"]
                    cur_battery = sensor_data["battery_pct"]
                    cur_hr = sensor_data["heart_rate"]
                    cur_g = sensor_data["g_force"]
                    cur_comms = lora_data["channel"]
                    t_lat = tourist_dict["current_lat"]
                    t_lon = tourist_dict["current_lon"]
                else:
                    cur_threat = t.threat_level
                    cur_battery = t.battery_pct
                    cur_hr = t.heart_rate
                    cur_g = t.g_force
                    cur_comms = t.comms_channel
                    t_lat = t.current_lat
                    t_lon = t.current_lon

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
                    "current_lat": t_lat,
                    "current_lon": t_lon,
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
                    "current_lat": round(tourist_dict["current_lat"] + 0.0024, 6),
                    "current_lon": round(tourist_dict["current_lon"] + 0.0028, 6),
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
                    "current_lat": round(tourist_dict["current_lat"] + 0.0016, 6),
                    "current_lon": round(tourist_dict["current_lon"] + 0.0032, 6),
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

            dispatches = departmental_engine.generate_dispatches(active_inc_dict, tourist_dict, rescue_state)

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
                "departmental_dispatches": dispatches,
                "forensic_ledger": forensic_ledger.get_recent_blocks(15),
                "forensic_audit": forensic_ledger.verify_integrity(),
                "terrain_profile": {
                    "tourist_elevation_m": round(tourist_dict.get("altitude", 1240.0), 1),
                    "outpost_elevation_m": 1180.0,
                    "delta_elevation_m": round(tourist_dict.get("altitude", 1240.0) - 1180.0, 1),
                    "transit_distance_km": 1.42,
                    "slope_gradient_deg": 18.4,
                    "terrain_ruggedness_index": 0.82,
                    "difficulty_rating": "GRADE-4 HIGH-CLEARANCE OFF-ROAD",
                    "canopy_density_pct": 68
                },
                "recent_events": events_list,
                "demo_step": self.demo_step,
                "demo_status_text": self.demo_status_text,
                "geofence_safe": [
                    [round(tourist_dict["current_lat"] + 0.0080, 6), round(tourist_dict["current_lon"] - 0.0120, 6)],
                    [round(tourist_dict["current_lat"] + 0.0095, 6), round(tourist_dict["current_lon"] + 0.0090, 6)],
                    [round(tourist_dict["current_lat"] - 0.0075, 6), round(tourist_dict["current_lon"] + 0.0105, 6)],
                    [round(tourist_dict["current_lat"] - 0.0090, 6), round(tourist_dict["current_lon"] - 0.0110, 6)]
                ],
                "geofence_hazard": [
                    [round(tourist_dict["current_lat"] - 0.0010, 6), round(tourist_dict["current_lon"] - 0.0035, 6)],
                    [round(tourist_dict["current_lat"] + 0.0015, 6), round(tourist_dict["current_lon"] + 0.0015, 6)],
                    [round(tourist_dict["current_lat"] - 0.0030, 6), round(tourist_dict["current_lon"] + 0.0025, 6)],
                    [round(tourist_dict["current_lat"] - 0.0045, 6), round(tourist_dict["current_lon"] - 0.0020, 6)]
                ],
                "landmarks": {
                    "ranger_hq": { "lat": round(tourist_dict["current_lat"] + 0.0065, 6), "lon": round(tourist_dict["current_lon"] + 0.0105, 6), "name": "Tactical Alpha Hub (Ranger HQ)" },
                    "uav_hangar": { "lat": round(uav_sim.base_lat, 6), "lon": round(uav_sim.base_lon, 6), "name": "UAV Drone Base (Pad 01)" },
                    "rescue_station": { "lat": round(rescue_sim.base_lat, 6), "lon": round(rescue_sim.base_lon, 6), "name": "Ground Rescue Outpost (Unit Echo-4)" }
                }
            }
        finally:
            db.close()

    def add_timeline_log(self, incident_id: Optional[int], event_type: str, title: str, description: str, source: str = "TACTICAL_HUB"):
        """Creates a timestamped cryptographic log entry and chains it to the forensic blockchain ledger"""
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

            # Record in cryptographic forensic ledger
            t = db.query(Tourist).filter(Tourist.ugid == self.current_tourist_ugid).first()
            lat = t.current_lat if (t and t.current_lat) else settings.DEFAULT_TOURIST_GPS["lat"]
            lon = t.current_lon if (t and t.current_lon) else settings.DEFAULT_TOURIST_GPS["lon"]
            threat = t.threat_level if t else "NORMAL"
            forensic_ledger.add_block(self.current_tourist_ugid, lat, lon, threat, event_type, f"{title} // {description}")
        finally:
            db.close()

    def update_tourist_gps(self, lat: float, lon: float, alt: float = None):
        """Updates live GPS coordinates and recalibrates sector assets relative to real device GPS"""
        db: Session = SessionLocal()
        try:
            t = db.query(Tourist).filter(Tourist.ugid == self.current_tourist_ugid).first()
            if t:
                t.current_lat = lat
                t.current_lon = lon
                if alt is not None:
                    t.altitude = alt
                db.commit()

            # Dynamic anchor recalibration for UAV and Rescue Base
            if uav_sim.status == "STANDBY":
                uav_sim.base_lat = round(lat + 0.0035, 6)
                uav_sim.base_lon = round(lon + 0.0025, 6)
                uav_sim.lat = uav_sim.base_lat
                uav_sim.lon = uav_sim.base_lon
                uav_sim.flight_trail = [[uav_sim.lat, uav_sim.lon]]

            if rescue_sim.status == "STANDBY":
                rescue_sim.set_base_location(lat, lon)
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

            # Trigger Telegram Autonomous Dispatch
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(telegram_notifier.send_emergency_alert(
                        incident={"incident_number": inc_num, "status": "CONFIRMED"},
                        tourist={
                            "ugid": ugid,
                            "current_lat": tourist.current_lat,
                            "current_lon": tourist.current_lon,
                            "blood_type": tourist.blood_type or "O-POS",
                            "medical_notes": tourist.medical_notes or "Penicillin Allergy (Severe)",
                            "emergency_contact": tourist.emergency_contact or "+1 (555) 019-2834"
                        }
                    ))
            except Exception as tg_err:
                print(f"[Telegram Dispatch Warning] {tg_err}")

            db.expunge(incident)
            return incident
        finally:
            db.close()

    def dispatch_uav(self, incident_id: Optional[int] = None, lkp_lat: Optional[float] = None, lkp_lon: Optional[float] = None):
        """Dispatches UAV-Alpha to LKP coordinates with dynamic GPS fallback"""
        target_lat = lkp_lat
        target_lon = lkp_lon

        db: Session = SessionLocal()
        try:
            inc = None
            if incident_id:
                inc = db.query(Incident).filter(Incident.id == incident_id).first()
            elif self.active_incident_id:
                inc = db.query(Incident).filter(Incident.id == self.active_incident_id).first()

            if inc:
                inc.status = "UAV_DISPATCHED"
                if target_lat is None or target_lon is None:
                    target_lat = inc.lkp_lat
                    target_lon = inc.lkp_lon

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
                    description=f"Drone airborne (24 m/s, 45m AGL). Vectoring to {target_lat:.5f}, {target_lon:.5f}.",
                    source="UAV_OPS",
                    cryptographic_hash=TimelineEvent.generate_hash("UAV Scramble", str(datetime.datetime.utcnow()), "UAV_OPS")
                )
                db.add_all([event1, event2])
                db.commit()

            # Dynamic fallback to active tourist coordinates
            if target_lat is None or target_lon is None:
                tourist = db.query(Tourist).filter(Tourist.ugid == self.current_tourist_ugid).first()
                if tourist and tourist.current_lat and tourist.current_lon:
                    target_lat = tourist.current_lat
                    target_lon = tourist.current_lon
                else:
                    target_lat = settings.DEFAULT_TOURIST_GPS["lat"]
                    target_lon = settings.DEFAULT_TOURIST_GPS["lon"]

            uav_sim.dispatch_to_lkp(target_lat, target_lon)
        finally:
            db.close()

    def start_uav_search(self):
        """Forces UAV into active expanding search pattern"""
        uav_sim.start_expanding_square_search()
        now_time = datetime.datetime.now().strftime("%H:%M:%S")
        self.add_timeline_log(self.active_incident_id, "SEARCH_INITIATED", f"{now_time} — Search initiated", "Expanding square search pattern commenced.", "UAV_OPS")

    def trigger_thermal_scan(self):
        """Forces immediate thermal target lock"""
        uav_sim.trigger_thermal_lock()
        now_time = datetime.datetime.now().strftime("%H:%M:%S")
        self.add_timeline_log(self.active_incident_id, "TARGET_DETECT", f"{now_time} — Victim located via FLIR (36.8°C)", f"Human body heat signature locked at {uav_sim.target_lat:.5f}, {uav_sim.target_lon:.5f}. Confidence: {uav_sim.target_confidence}%.", "UAV_OPS")

    def return_uav_to_base(self):
        """Forces UAV to return to base"""
        uav_sim.return_to_base()
        now_time = datetime.datetime.now().strftime("%H:%M:%S")
        self.add_timeline_log(self.active_incident_id, "UAV_RTL", f"{now_time} — UAV RTL Initiated", "UAV returning to Base Pad 01.", "UAV_OPS")

    def reset_uav(self):
        """Resets UAV to standby at Base Pad 01"""
        uav_sim.reset_to_base()

    def dispatch_ground_rescue(self, incident_id: int):
        """Dispatches Ground Rescue Team to target coordinates"""
        db: Session = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            t = db.query(Tourist).filter(Tourist.ugid == self.current_tourist_ugid).first()
            default_t_lat = t.current_lat if (t and t.current_lat) else settings.DEFAULT_TOURIST_GPS["lat"]
            default_t_lon = t.current_lon if (t and t.current_lon) else settings.DEFAULT_TOURIST_GPS["lon"]

            target_lat = (inc.target_lat or inc.lkp_lat) if inc else (uav_sim.target_lat or default_t_lat)
            target_lon = (inc.target_lon or inc.lkp_lon) if inc else (uav_sim.target_lon or default_t_lon)

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
        """Executes the full automated 10-step rescue scenario at exact 5.5-second intervals (55.0s total)"""
        try:
            # Phase 1 (0.0s - 5.5s): STEP 1/10: TOURIST NOMINAL // GAIT TELEMETRY STREAMING
            self.reset_system()
            self.demo_step = 1
            self.demo_status_text = "STEP 1/10: TOURIST NOMINAL // GAIT TELEMETRY STREAMING"
            sensor_sim.set_mode("NORMAL_WALK")
            lora_sim.set_channel("CELLULAR_4G")
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(None, "NORMAL_STATE", f"{now_time} — Baseline telemetry streaming // Normal gait", "All 4 tourist beacons reporting nominal GPS & biometric streams.", "MOBILE_AI")
            await asyncio.sleep(5.5)

            # Phase 2 (5.5s - 11.0s): STEP 2/10: IMPACT DETECTED // 3.8g KINEMATIC SPIKE
            self.demo_step = 2
            self.demo_status_text = "STEP 2/10: IMPACT DETECTED // 3.8g KINEMATIC SPIKE"
            sensor_sim.set_mode("FALLING")
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(None, "IMPACT_DETECTED", f"{now_time} — Impact detected (3.8g)", "IMU sensor registered abnormal impact spike on UGID GX-8921-ALPHA.", "MOBILE_AI")
            await asyncio.sleep(5.5)

            # Phase 3 (11.0s - 16.5s): STEP 3/10: IMMOBILITY TRIGGERED // THREAT CRITICAL
            self.demo_step = 3
            self.demo_status_text = "STEP 3/10: IMMOBILITY TRIGGERED // THREAT CRITICAL"
            sensor_sim.set_mode("IMMOBILE")
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(None, "IMMOBILE_TRIGGER", f"{now_time} — Sustained immobility confirmed", "Zero kinematic motion sustained for 15s. Threat elevated to CRITICAL.", "MOBILE_AI")
            await asyncio.sleep(5.5)

            # Phase 4 (16.5s - 22.0s): STEP 4/10: LKP ENCRYPTED & LOCKED // RADAR BOUNDS ACTIVE
            self.demo_step = 4
            self.demo_status_text = "STEP 4/10: LKP ENCRYPTED & LOCKED // RADAR BOUNDS ACTIVE"
            lora_sim.set_channel("LORA_MESH")
            inc = self.trigger_emergency(self.current_tourist_ugid, "FALL_DETECTED", "Automated AI Fall & Immobility Trigger")
            await asyncio.sleep(5.5)

            # Phase 5 (22.0s - 27.5s): STEP 5/10: OASIS CAP v1.2 MULTI-AGENCY DISPATCH
            self.demo_step = 5
            self.demo_status_text = "STEP 5/10: OASIS CAP v1.2 MULTI-AGENCY DISPATCH"
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(inc.id, "CAP_ALERT", f"{now_time} — OASIS CAP v1.2 Dispatched", "Encrypted multi-agency payload sent to Police, Mercy Hospital, and SAR Outpost.", "TACTICAL_HUB")
            await asyncio.sleep(5.5)

            # Phase 6 (27.5s - 33.0s): STEP 6/10: UAV AIRBORNE // TRANSIT TO LKP
            self.demo_step = 6
            self.demo_status_text = "STEP 6/10: UAV AIRBORNE // TRANSIT TO LKP"
            self.dispatch_uav(inc.id)
            await asyncio.sleep(5.5)

            # Phase 7 (33.0s - 38.5s): STEP 7/10: ISRID SECTOR SCANNING // EXPANDING SQUARE
            self.demo_step = 7
            self.demo_status_text = "STEP 7/10: ISRID SECTOR SCANNING // EXPANDING SQUARE"
            self.start_uav_search()
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(inc.id, "SEARCH_START", f"{now_time} — ISRID sector search engaged", "Expanding square search pattern active at 45m AGL with Ironbow FLIR feed.", "UAV_OPS")
            await asyncio.sleep(5.5)

            # Phase 8 (38.5s - 44.0s): STEP 8/10: FLIR THERMAL LOCK // VICTIM ACQUIRED (36.8°C)
            self.demo_step = 8
            self.demo_status_text = "STEP 8/10: FLIR THERMAL LOCK // VICTIM ACQUIRED (36.8°C)"
            self.trigger_thermal_scan()
            await asyncio.sleep(5.5)

            # Phase 9 (44.0s - 49.5s): STEP 9/10: GROUND UNIT ECHO-4 INTERCEPT // ON-SCENE
            self.demo_step = 9
            self.demo_status_text = "STEP 9/10: GROUND UNIT ECHO-4 INTERCEPT // ON-SCENE"
            self.dispatch_ground_rescue(inc.id)
            await asyncio.sleep(5.5)

            # Phase 10 (49.5s - 55.0s): STEP 10/10: RESCUE COMPLETE // SHA-256 MERKLE SEALED
            self.demo_step = 10
            self.demo_status_text = "STEP 10/10: RESCUE COMPLETE // SHA-256 MERKLE SEALED"
            self.resolve_incident(inc.id)
            now_time = datetime.datetime.now().strftime("%H:%M:%S")
            self.add_timeline_log(inc.id, "MERKLE_SEAL", f"{now_time} — Rescue complete & Merkle sealed", "Forensic SHA-256 blockchain ledger sealed. All assets in nominal stand-down.", "COMMAND")
            await asyncio.sleep(5.5)

        except asyncio.CancelledError:
            print("[Demo Routine] Cancelled by user/reset.")
        except Exception as e:
            print(f"[Demo Routine Error] {e}")

incident_manager = IncidentManager()
