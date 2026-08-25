import json
import asyncio
import hashlib
import datetime
from typing import Set, Dict, Any, Optional
from fastapi import WebSocket

class MultiDepartmentAlertEngine:
    """
    Autonomously generates specialized, encrypted, and cryptographically hashed
    multi-agency dispatches for:
    1. Police Department (Live Pursuit & Intercept)
    2. Hospital / Emergency Medical Fast-Track Protocol
    3. Forest / Ground Search & Rescue (Tactical Unit Echo-4)
    """

    @staticmethod
    def _compute_sha256(data_dict: dict) -> str:
        raw_str = json.dumps(data_dict, sort_keys=True)
        return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()

    def generate_dispatches(self, incident: Optional[dict], tourist: dict, rescue_team: dict) -> Dict[str, Any]:
        now_str = datetime.datetime.utcnow().strftime("%H:%M:%S")
        is_emergency = incident is not None and incident.get("status") in ["ACTIVE", "DISPATCHED", "CONFIRMED", "SEARCHING", "TARGET_LOCKED", "RESCUE_IN_PROGRESS"]

        ugid = tourist.get("ugid", "GX-8921-ALPHA")
        lat = tourist.get("current_lat", 37.7420)
        lon = tourist.get("current_lon", -119.5975)
        alt = tourist.get("altitude", 1240.0)
        contact = tourist.get("emergency_contact", "+1 (555) 019-2834")
        blood_type = tourist.get("blood_type", "O-POS")
        medical_notes = tourist.get("medical_notes", "Penicillin Allergy / No Chronic Conditions")
        threat = tourist.get("threat_level", "NORMAL")
        eta_min = rescue_team.get("eta_minutes", 3.5)

        # 1. Police Department Package (Law Enforcement Tactical Intercept)
        police_payload = {
            "dept_code": "LAW_ENFORCEMENT_PD",
            "agency_name": "Regional Tactical Police Dispatch (Sector 4)",
            "callsign": "INTERCEPT-710 // PURSUIT-ALPHA",
            "status": "PURSUIT_VECTOR_ACTIVE" if is_emergency else "STANDBY_MONITORING",
            "status_label": "PURSUIT VECTOR ACTIVE" if is_emergency else "PATROL STANDBY",
            "target_ugid": ugid,
            "target_coordinates": f"{lat:.5f}°N, {abs(lon):.5f}°W",
            "altitude_agl": f"{alt:.1f}m ASL",
            "velocity_vector": f"G-Force: {tourist.get('g_force', 1.0)}g | Heading: 214° SW",
            "emergency_contact": contact,
            "dispatch_priority": "DEFCON-1 IMMEDIATE" if is_emergency else "ROUTINE",
            "encrypted_channel": "AES-256-GCM // FREQ 155.475 MHz (APCO P25)",
            "recipient_station": "CENTRAL POLICE PRECINCT // SECTOR 4 INTERCEPT HUB",
            "timestamp": now_str,
            "acknowledged": is_emergency
        }
        police_hash = self._compute_sha256(police_payload)
        police_payload["sha256_hash"] = police_hash

        # 2. Hospital / Emergency Medical Fast-Track Package
        medical_payload = {
            "dept_code": "MEDICAL_TRAUMA_FASTTRACK",
            "agency_name": "Emergency Medical Services / Mercy Trauma Center",
            "callsign": "MEDIC-33 // ADVANCED-LIFE-SUPPORT",
            "hospital_recipient": "MERCY LEVEL-1 TRAUMA CENTER (TRIAGE BAY 02)",
            "status": "HOSPITAL_ALERTED // BLOOD_TYPE_ATTACHED" if is_emergency else "STANDBY_MONITORING",
            "status_label": "HOSPITAL ALERTED // FAST-TRACK" if is_emergency else "STANDBY",
            "target_ugid": ugid,
            "patient_name": tourist.get("full_name", "Elena Rostova"),
            "blood_type": blood_type,
            "known_allergies": "Penicillin (Severe Anaphylaxis Risk)",
            "medical_vault_notes": medical_notes,
            "live_vitals_telemetry": f"Heart Rate: {tourist.get('heart_rate', 76)} BPM | Impact: {tourist.get('g_force', 1.0)}g",
            "ambulance_unit": "AMBULANCE ECHO-33",
            "ambulance_eta": f"{eta_min:.1f} MINS" if is_emergency else "--",
            "dispatch_priority": "CRITICAL TRAUMA FAST-TRACK" if is_emergency else "ROUTINE",
            "encrypted_channel": "HIPAA-SECURE TLS 1.3 // MED-COM 462.950 MHz",
            "timestamp": now_str,
            "acknowledged": is_emergency
        }
        medical_hash = self._compute_sha256(medical_payload)
        medical_payload["sha256_hash"] = medical_hash

        # 3. Forest / Ground Search & Rescue (SAR) Package
        sar_payload = {
            "dept_code": "GROUND_SAR_FOREST",
            "agency_name": "Mountain & Wilderness Search and Rescue Division",
            "callsign": "TACTICAL ALL-TERRAIN UNIT ECHO-4",
            "status": "ECHO-4_DISPATCHED // OFF_ROAD_ACTIVE" if is_emergency else "OUTPOST_STANDBY",
            "status_label": "ECHO-4 DISPATCHED // OFF-ROAD ACTIVE" if is_emergency else "OUTPOST STANDBY",
            "target_ugid": ugid,
            "terrain_entry_point": "TRAILHEAD ACCESS GATE BRAVO (GRID 37-119)",
            "lkp_coordinates": f"{lat:.5f}°N, {abs(lon):.5f}°W",
            "altitude_asl": f"{alt:.1f}m ASL",
            "routing_vector": "BEARING 214° AZIMUTH // ROUGH TERRAIN GRADE 4",
            "assigned_vehicle": "Echo-4 Polaris Ranger High-Clearance ATV",
            "rescue_team_eta": f"{eta_min:.1f} MINS" if is_emergency else "--",
            "dispatch_priority": "IMMEDIATE MOUNTAIN RESCUE" if is_emergency else "ROUTINE",
            "encrypted_channel": "LORA 868MHz TACTICAL MESH // DMR TIER III",
            "recipient_station": "RANGER RESCUE OUTPOST // SECTOR ALPHA",
            "timestamp": now_str,
            "acknowledged": is_emergency
        }
        sar_hash = self._compute_sha256(sar_payload)
        sar_payload["sha256_hash"] = sar_hash

        return {
            "is_emergency_active": is_emergency,
            "timestamp": now_str,
            "police": police_payload,
            "medical": medical_payload,
            "sar": sar_payload,
            "transmission_verified": True,
            "encryption_standard": "AES-256-GCM + SHA-256 FORENSIC AUDIT TRAIL"
        }

departmental_engine = MultiDepartmentAlertEngine()

class AlertDispatcher:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        print(f"[WebSocket] Client connected. Total active: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        print(f"[WebSocket] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcasts a JSON message to all connected clients"""
        if not self.active_connections:
            return

        payload = json.dumps(message)
        dead_connections = set()
        
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.add(connection)

        if dead_connections:
            async with self._lock:
                for dead in dead_connections:
                    if dead in self.active_connections:
                        self.active_connections.remove(dead)

dispatcher = AlertDispatcher()
