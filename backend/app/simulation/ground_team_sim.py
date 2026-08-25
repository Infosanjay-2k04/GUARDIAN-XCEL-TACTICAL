import math
import time
from app.config import settings

class GroundRescueSimulator:
    """
    Simulates Ground Rescue Unit (Echo-4) dynamics utilizing Tobler's Mountain Hiking Function:
    W = 6 * exp(-3.5 * abs(slope + 0.05)) [km/h]
    and tracks the critical 60-Minute Golden Hour Trauma Window.
    """
    def __init__(self):
        self.callsign = "GROUND ECHO-4"
        self.unit_type = "Tactical Polaris Ranger ATV (Rapid Response)"
        self.status = "STANDBY" # STANDBY, DISPATCHED, ON_SCENE, RETURNING
        
        self.lat = settings.RESCUE_STATION_GPS["lat"]
        self.lon = settings.RESCUE_STATION_GPS["lon"]
        self.base_lat = settings.RESCUE_STATION_GPS["lat"]
        self.base_lon = settings.RESCUE_STATION_GPS["lon"]
        self.base_altitude_m = 1180.0
        self.target_altitude_m = 1240.0
        
        self.speed_mps = 0.0
        self.target_lat = None
        self.target_lon = None
        self.eta_seconds = 0
        self.eta_minutes = 0.0
        
        # Tobler Function State
        self.slope_gradient = 0.042 # dh / d
        self.tobler_speed_kmh = 16.5 # ATV terrain adjusted
        self.slope_deg = 18.4
        
        # Golden Hour Trauma Clock (60 minutes = 3600 seconds)
        self.incident_start_time = None
        self.golden_hour_total_seconds = 3600

    def _calculate_tobler_speed(self, dist_meters: float, delta_alt_m: float) -> float:
        """
        Tobler's Hiking Function: W = 6 * exp(-3.5 * abs(slope + 0.05)) km/h
        Adjusted with a 2.5x ATV motorized powertrain factor.
        """
        if dist_meters < 5.0:
            return 8.0 # m/s default
        
        slope = delta_alt_m / dist_meters
        self.slope_gradient = round(slope, 4)
        self.slope_deg = round(math.degrees(math.atan(slope)), 1)
        
        # Base Tobler walking speed in km/h
        w_walking_kmh = 6.0 * math.exp(-3.5 * abs(slope + 0.05))
        
        # Tactical high-clearance ATV multiplier
        w_atv_kmh = max(8.0, min(35.0, w_walking_kmh * 3.2))
        self.tobler_speed_kmh = round(w_atv_kmh, 1)
        
        # Convert km/h to m/s
        return w_atv_kmh / 3.6

    def dispatch_to_target(self, target_lat: float, target_lon: float, target_alt_m: float = 1240.0):
        self.status = "DISPATCHED"
        self.target_lat = target_lat
        self.target_lon = target_lon
        self.target_altitude_m = target_alt_m
        
        if self.incident_start_time is None:
            self.incident_start_time = time.time()
        
        # Calculate initial distance, altitude difference & Tobler speed
        d_lat = (target_lat - self.lat) * 111111.0
        d_lon = (target_lon - self.lon) * 111111.0 * math.cos(math.radians(target_lat))
        dist_meters = math.sqrt(d_lat**2 + d_lon**2)
        delta_alt = self.target_altitude_m - self.base_altitude_m
        
        self.speed_mps = self._calculate_tobler_speed(dist_meters, delta_alt)
        self.eta_seconds = int(dist_meters / max(0.5, self.speed_mps))
        self.eta_minutes = round(self.eta_seconds / 60.0, 1)

    def reset_to_base(self):
        self.status = "STANDBY"
        self.lat = self.base_lat
        self.lon = self.base_lon
        self.speed_mps = 0.0
        self.target_lat = None
        self.target_lon = None
        self.eta_seconds = 0
        self.eta_minutes = 0.0
        self.incident_start_time = None

    def tick(self, dt: float = 0.2):
        if self.status == "STANDBY" or self.status == "ON_SCENE":
            self.speed_mps = 0.0
            return

        if self.status == "DISPATCHED" and self.target_lat is not None:
            d_lat_deg = self.target_lat - self.lat
            d_lon_deg = self.target_lon - self.lon
            d_lat_m = d_lat_deg * 111111.0
            d_lon_m = d_lon_deg * 111111.0 * math.cos(math.radians(self.target_lat))
            dist_meters = math.sqrt(d_lat_m**2 + d_lon_m**2)

            step_meters = self.speed_mps * dt
            if dist_meters <= max(5.0, step_meters * 1.5):
                self.lat = self.target_lat
                self.lon = self.target_lon
                self.status = "ON_SCENE"
                self.speed_mps = 0.0
                self.eta_seconds = 0
                self.eta_minutes = 0.0
            else:
                ratio = step_meters / dist_meters
                self.lat += d_lat_deg * ratio
                self.lon += d_lon_deg * ratio
                self.eta_seconds = max(0, int(dist_meters / max(0.5, self.speed_mps)))
                self.eta_minutes = round(self.eta_seconds / 60.0, 1)

    def get_state(self) -> dict:
        now = time.time()
        if self.incident_start_time:
            elapsed_sec = int(now - self.incident_start_time)
            golden_hour_remaining_sec = max(0, self.golden_hour_total_seconds - elapsed_sec)
        else:
            golden_hour_remaining_sec = 3520 # Demo initial ~58m 40s
            elapsed_sec = 80

        golden_hour_pct = round((golden_hour_remaining_sec / self.golden_hour_total_seconds) * 100.0, 1)
        mins = golden_hour_remaining_sec // 60
        secs = golden_hour_remaining_sec % 60
        golden_hour_formatted = f"{mins:02d}:{secs:02d}"

        return {
            "team_callsign": self.callsign,
            "unit_type": self.unit_type,
            "status": self.status,
            "current_lat": round(self.lat, 6),
            "current_lon": round(self.lon, 6),
            "speed_mps": round(self.speed_mps, 1),
            "eta_seconds": self.eta_seconds,
            "eta_minutes": self.eta_minutes,
            "tobler_kinematics": {
                "slope_gradient": self.slope_gradient,
                "slope_deg": self.slope_deg,
                "speed_kmh": self.tobler_speed_kmh,
                "formula": "W = 6 * exp(-3.5 * |slope + 0.05|) [km/h]"
            },
            "golden_hour": {
                "remaining_seconds": golden_hour_remaining_sec,
                "formatted": golden_hour_formatted,
                "progress_pct": golden_hour_pct,
                "urgency": "CRITICAL" if golden_hour_remaining_sec < 1800 else "NORMAL"
            }
        }

rescue_sim = GroundRescueSimulator()
