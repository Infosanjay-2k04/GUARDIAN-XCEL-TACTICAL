import math
import time
from app.config import settings

class GroundRescueSimulator:
    def __init__(self):
        self.callsign = "GROUND ECHO-4"
        self.unit_type = "Tactical All-Terrain Rapid Response"
        self.status = "STANDBY" # STANDBY, DISPATCHED, ON_SCENE, RETURNING
        
        self.lat = settings.RESCUE_STATION_GPS["lat"]
        self.lon = settings.RESCUE_STATION_GPS["lon"]
        self.base_lat = settings.RESCUE_STATION_GPS["lat"]
        self.base_lon = settings.RESCUE_STATION_GPS["lon"]
        
        self.speed_mps = 0.0
        self.target_lat = None
        self.target_lon = None
        self.eta_seconds = 0

    def dispatch_to_target(self, target_lat: float, target_lon: float):
        self.status = "DISPATCHED"
        self.target_lat = target_lat
        self.target_lon = target_lon
        self.speed_mps = settings.RESCUE_TEAM_SPEED_MPS
        
        # Calculate initial distance & ETA
        d_lat = target_lat - self.lat
        d_lon = target_lon - self.lon
        dist_meters = math.sqrt(d_lat**2 + d_lon**2) * 111000.0
        self.eta_seconds = int(dist_meters / max(1.0, self.speed_mps))

    def reset_to_base(self):
        self.status = "STANDBY"
        self.lat = self.base_lat
        self.lon = self.base_lon
        self.speed_mps = 0.0
        self.target_lat = None
        self.target_lon = None
        self.eta_seconds = 0

    def tick(self, dt: float = 0.2):
        if self.status == "STANDBY" or self.status == "ON_SCENE":
            self.speed_mps = 0.0
            return

        if self.status == "DISPATCHED" and self.target_lat is not None:
            d_lat = self.target_lat - self.lat
            d_lon = self.target_lon - self.lon
            dist_meters = math.sqrt(d_lat**2 + d_lon**2) * 111000.0

            step_meters = self.speed_mps * dt
            if dist_meters <= step_meters * 1.5:
                # Arrived on scene
                self.lat = self.target_lat
                self.lon = self.target_lon
                self.status = "ON_SCENE"
                self.speed_mps = 0.0
                self.eta_seconds = 0
            else:
                ratio = step_meters / dist_meters
                self.lat += d_lat * ratio
                self.lon += d_lon * ratio
                self.eta_seconds = max(0, int(dist_meters / self.speed_mps))

    def get_state(self) -> dict:
        return {
            "team_callsign": self.callsign,
            "unit_type": self.unit_type,
            "status": self.status,
            "current_lat": round(self.lat, 6),
            "current_lon": round(self.lon, 6),
            "speed_mps": round(self.speed_mps, 1),
            "eta_seconds": self.eta_seconds
        }

rescue_sim = GroundRescueSimulator()
