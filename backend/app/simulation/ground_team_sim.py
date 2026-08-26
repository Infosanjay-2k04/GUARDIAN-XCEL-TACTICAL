import math
import time
from app.config import settings

class GroundRescueSimulator:
    """
    Simulates Ground Tactical SAR Unit (Echo-4) dynamics utilizing Tobler's Mountain Hiking Function:
    W = 6 * exp(-3.5 * abs(slope + 0.05)) [km/h]
    with motorized off-road 4x4 powertrain adjustments, tracking intercept routing,
    and monitoring the critical 60-Minute Golden Hour Trauma Window.
    """
    def __init__(self):
        self.callsign = "TACTICAL SAR // ECHO-4"
        self.team_callsign = "TACTICAL SAR // ECHO-4"
        self.unit_type = "4x4 ALL-TERRAIN RAPID RESPONSE"
        self.vehicle_model = "Polaris Ranger Crew XP 1000 Tactical"
        self.personnel_count = 4
        self.status = "STANDBY" # STANDBY, DISPATCHED, EN_ROUTE, ON_SCENE, VICTIM_SECURED, RETURNING
        
        # Base outpost coordinates (default Sector Alpha outpost offset ~600m)
        self.base_lat = settings.RESCUE_STATION_GPS["lat"]
        self.base_lon = settings.RESCUE_STATION_GPS["lon"]
        self.lat = self.base_lat
        self.lon = self.base_lon
        
        self.base_altitude_m = 1180.0
        self.target_altitude_m = 1240.0
        
        self.speed_mps = 0.0
        self.target_lat = None
        self.target_lon = None
        self.distance_to_target_m = 0.0
        self.initial_distance_m = 650.0
        self.eta_seconds = 0
        self.eta_minutes = 0.0
        
        # Tobler Function State
        self.slope_gradient = 0.042 # dh / d
        self.tobler_speed_kmh = 28.5 # ATV terrain adjusted (25-40 km/h)
        self.slope_deg = 18.4
        
        # On-Scene Triage Counter
        self.on_scene_time = None
        self.triage_duration_sec = 6.0
        
        # Golden Hour Trauma Clock (60 minutes = 3600 seconds)
        self.incident_start_time = None
        self.golden_hour_total_seconds = 3600

    def set_base_location(self, victim_lat: float, victim_lon: float):
        """Dynamically positions Rescue Outpost ~600m from active victim GPS anchor"""
        if self.status == "STANDBY":
            self.base_lat = round(victim_lat + 0.0050, 6) # ~550m North
            self.base_lon = round(victim_lon - 0.0035, 6) # ~380m West
            self.lat = self.base_lat
            self.lon = self.base_lon

    def _calculate_tobler_speed(self, dist_meters: float, delta_alt_m: float) -> float:
        """
        Tobler's Hiking Function: W = 6 * exp(-3.5 * abs(slope + 0.05)) km/h
        Adjusted with tactical high-clearance 4x4 powertrain factor for 25-40 km/h cruising.
        """
        if dist_meters < 5.0:
            return 8.5 # m/s default
        
        slope = delta_alt_m / dist_meters
        self.slope_gradient = round(slope, 4)
        self.slope_deg = round(math.degrees(math.atan(slope)), 1)
        
        # Base Tobler speed in km/h
        w_base_kmh = 6.0 * math.exp(-3.5 * abs(slope + 0.05))
        
        # Tactical off-road vehicle speed multiplier (25 - 40 km/h)
        w_atv_kmh = max(24.0, min(40.0, w_base_kmh * 5.2))
        self.tobler_speed_kmh = round(w_atv_kmh, 1)
        
        # Convert km/h to m/s (~7.0 - 11.1 m/s)
        return w_atv_kmh / 3.6

    def _calculate_bearing(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates forward true azimuth / bearing in degrees (0-360)"""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)
        y = math.sin(delta_lambda) * math.cos(phi2)
        x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        bearing = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0
        return round(bearing, 1)

    def dispatch_to_target(self, target_lat: float, target_lon: float, target_alt_m: float = 1240.0):
        """Activates Ground Tactical Unit towards target LKP"""
        self.status = "EN_ROUTE"
        self.target_lat = target_lat
        self.target_lon = target_lon
        self.target_altitude_m = target_alt_m
        self.on_scene_time = None
        self.heading_deg = self._calculate_bearing(self.lat, self.lon, target_lat, target_lon)
        
        if self.incident_start_time is None:
            self.incident_start_time = time.time()
        
        # Calculate initial distance, altitude difference & Tobler speed
        d_lat = (target_lat - self.lat) * 111111.0
        d_lon = (target_lon - self.lon) * 111111.0 * math.cos(math.radians(target_lat))
        dist_meters = math.sqrt(d_lat**2 + d_lon**2)
        self.initial_distance_m = dist_meters
        self.distance_to_target_m = round(dist_meters, 1)
        
        delta_alt = self.target_altitude_m - self.base_altitude_m
        self.speed_mps = self._calculate_tobler_speed(dist_meters, delta_alt)
        self.eta_seconds = max(10, int(dist_meters / max(1.0, self.speed_mps)))
        self.eta_minutes = round(self.eta_seconds / 60.0, 1)

    def reset_to_base(self):
        """Resets Ground Tactical Unit to standby at Rescue Outpost"""
        self.status = "STANDBY"
        self.lat = self.base_lat
        self.lon = self.base_lon
        self.speed_mps = 0.0
        self.heading_deg = 0.0
        self.target_lat = None
        self.target_lon = None
        self.distance_to_target_m = 0.0
        self.eta_seconds = 0
        self.eta_minutes = 0.0
        self.on_scene_time = None
        self.incident_start_time = None

    def tick(self, dt: float = 0.2):
        """Kinematic simulation tick (5-10Hz) for off-road approach vector"""
        if self.status == "STANDBY":
            self.speed_mps = 0.0
            return

        if self.status in ["DISPATCHED", "EN_ROUTE"] and self.target_lat is not None:
            d_lat_deg = self.target_lat - self.lat
            d_lon_deg = self.target_lon - self.lon
            d_lat_m = d_lat_deg * 111111.0
            d_lon_m = d_lon_deg * 111111.0 * math.cos(math.radians(self.target_lat))
            dist_meters = math.sqrt(d_lat_m**2 + d_lon_m**2)
            self.distance_to_target_m = round(dist_meters, 1)

            # Continuous bearing calculation
            self.heading_deg = self._calculate_bearing(self.lat, self.lon, self.target_lat, self.target_lon)

            # Continuous Tobler terrain resistance adjustment
            delta_alt = self.target_altitude_m - self.base_altitude_m
            self.speed_mps = self._calculate_tobler_speed(dist_meters, delta_alt)

            step_meters = self.speed_mps * dt
            # Reached within 10 meters of LKP -> On-scene transition
            if dist_meters <= max(10.0, step_meters * 1.2):
                self.lat = self.target_lat
                self.lon = self.target_lon
                self.status = "ON_SCENE"
                self.speed_mps = 0.0
                self.distance_to_target_m = 0.0
                self.eta_seconds = 0
                self.eta_minutes = 0.0
                self.on_scene_time = time.time()
            else:
                ratio = step_meters / max(1.0, dist_meters)
                self.lat += d_lat_deg * ratio
                self.lon += d_lon_deg * ratio
                self.eta_seconds = max(0, int(dist_meters / max(1.0, self.speed_mps)))
                self.eta_minutes = round(self.eta_seconds / 60.0, 1)

        elif self.status == "ON_SCENE":
            self.speed_mps = 0.0
            self.distance_to_target_m = 0.0
            self.eta_seconds = 0
            # Auto-transition to VICTIM_SECURED after initial stabilization
            if self.on_scene_time and (time.time() - self.on_scene_time > self.triage_duration_sec):
                self.status = "VICTIM_SECURED"

        elif self.status == "VICTIM_SECURED":
            self.speed_mps = 0.0
            self.distance_to_target_m = 0.0
            self.eta_seconds = 0

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

        eta_mins = self.eta_seconds // 60
        eta_secs = self.eta_seconds % 60
        eta_formatted = f"{eta_mins:02d}:{eta_secs:02d}"

        return {
            "team_callsign": self.team_callsign,
            "callsign": self.callsign,
            "unit_type": self.unit_type,
            "vehicle_model": self.vehicle_model,
            "personnel_count": self.personnel_count,
            "status": self.status,
            "current_lat": round(self.lat, 6),
            "current_lon": round(self.lon, 6),
            "base_lat": round(self.base_lat, 6),
            "base_lon": round(self.base_lon, 6),
            "target_lat": round(self.target_lat, 6) if self.target_lat else None,
            "target_lon": round(self.target_lon, 6) if self.target_lon else None,
            "distance_to_target_m": round(self.distance_to_target_m, 1),
            "speed_mps": round(self.speed_mps, 1),
            "speed_kmh": round(self.speed_mps * 3.6, 1),
            "heading_deg": getattr(self, 'heading_deg', 0.0),
            "eta_seconds": self.eta_seconds,
            "eta_minutes": self.eta_minutes,
            "eta_formatted": eta_formatted,
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
