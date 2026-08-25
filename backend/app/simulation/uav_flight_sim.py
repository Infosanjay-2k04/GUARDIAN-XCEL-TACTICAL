import math
import time
from app.config import settings

class UAVFlightSimulator:
    def __init__(self):
        self.callsign = "UAV-ALPHA // PHOENIX-1"
        self.status = "STANDBY" # STANDBY, EN_ROUTE_LKP, SEARCHING, TARGET_LOCKED, HOVER_BEACON, RETURNING
        
        # Coordinates (Base Hangar)
        self.lat = settings.UAV_HANGAR_GPS["lat"]
        self.lon = settings.UAV_HANGAR_GPS["lon"]
        self.base_lat = settings.UAV_HANGAR_GPS["lat"]
        self.base_lon = settings.UAV_HANGAR_GPS["lon"]
        
        self.altitude_agl = 0.0 # meters
        self.battery_pct = 98.5
        self.airspeed_mps = 0.0
        self.heading_deg = 0.0
        
        # Mission targets
        self.target_lkp_lat = None
        self.target_lkp_lon = None
        self.search_pattern = "EXPANDING_SQUARE"
        self.search_progress_pct = 0.0
        self.search_start_time = 0.0
        self.search_leg = 0
        
        # Detection lock
        self.target_locked = False
        self.target_confidence = 0.0
        self.target_lat = None
        self.target_lon = None
        self.target_thermal_temp = 0.0

    def dispatch_to_lkp(self, lkp_lat: float, lkp_lon: float):
        """Commands UAV to take off and transit to Last Known Position (LKP)"""
        self.status = "EN_ROUTE_LKP"
        self.target_lkp_lat = lkp_lat
        self.target_lkp_lon = lkp_lon
        self.search_progress_pct = 0.0
        self.target_locked = False
        self.target_confidence = 0.0
        self.airspeed_mps = settings.UAV_SPEED_MPS

    def reset_to_base(self):
        self.status = "STANDBY"
        self.lat = self.base_lat
        self.lon = self.base_lon
        self.altitude_agl = 0.0
        self.battery_pct = 98.5
        self.airspeed_mps = 0.0
        self.heading_deg = 0.0
        self.target_lkp_lat = None
        self.target_lkp_lon = None
        self.search_progress_pct = 0.0
        self.target_locked = False
        self.target_confidence = 0.0
        self.target_lat = None
        self.target_lon = None
        self.target_thermal_temp = 0.0

    def tick(self, dt: float = 0.2):
        """Updates physics and kinematics at 5Hz (dt=0.2s)"""
        if self.status == "STANDBY":
            self.airspeed_mps = 0.0
            self.altitude_agl = 0.0
            return

        # Battery consumption in flight
        self.battery_pct = max(5.0, round(self.battery_pct - 0.01 * dt, 2))

        # Takeoff climb
        if self.altitude_agl < 45.0:
            self.altitude_agl = min(45.0, round(self.altitude_agl + 8.0 * dt, 1))

        if self.status == "EN_ROUTE_LKP" and self.target_lkp_lat is not None:
            # Calculate distance and bearing to LKP
            d_lat = self.target_lkp_lat - self.lat
            d_lon = self.target_lkp_lon - self.lon
            dist_deg = math.sqrt(d_lat**2 + d_lon**2)
            
            # Approx 1 deg lat ~ 111,000 meters
            dist_meters = dist_deg * 111000.0
            self.heading_deg = round((math.degrees(math.atan2(d_lon, d_lat)) + 360) % 360, 1)

            step_meters = self.airspeed_mps * dt
            if dist_meters <= step_meters * 1.5:
                # Arrived at LKP -> Transition to autonomous search
                self.lat = self.target_lkp_lat
                self.lon = self.target_lkp_lon
                self.status = "SEARCHING"
                self.search_start_time = time.time()
                self.search_leg = 0
            else:
                ratio = step_meters / dist_meters
                self.lat += d_lat * ratio
                self.lon += d_lon * ratio

        elif self.status == "SEARCHING":
            # Expanding square search pattern simulation around LKP
            self.airspeed_mps = 16.0 # Slower tactical search speed
            self.altitude_agl = 35.0 # Optimal FLIR altitude
            
            # Progress meter increments steadily
            self.search_progress_pct = min(100.0, round(self.search_progress_pct + 4.5 * dt, 1))
            
            # Fly in expanding search geometry
            t = (time.time() - self.search_start_time) * 0.8
            radius_deg = (0.0003 + 0.00008 * t) # Expanding radius
            self.lat = self.target_lkp_lat + radius_deg * math.sin(t * 1.2)
            self.lon = self.target_lkp_lon + radius_deg * math.cos(t * 1.2)
            self.heading_deg = round((math.degrees(t * 1.2) + 90) % 360, 1)

            # When search reaches ~60%, AI target recognition acquires thermal lock
            if self.search_progress_pct >= 55.0 and not self.target_locked:
                self.target_locked = True
                self.status = "TARGET_LOCKED"
                self.target_confidence = 97.6
                self.target_lat = round(self.target_lkp_lat + 0.00012, 6)
                self.target_lon = round(self.target_lkp_lon - 0.00008, 6)
                self.target_thermal_temp = 36.8

        elif self.status == "TARGET_LOCKED":
            # Stable hover & orbit over confirmed victim location
            self.airspeed_mps = 4.0
            self.altitude_agl = 30.0
            self.target_confidence = min(99.4, round(self.target_confidence + 0.1 * dt, 1))
            
            # Minor orbit jitter
            t = time.time() * 0.5
            self.lat = self.target_lat + 0.00004 * math.sin(t)
            self.lon = self.target_lon + 0.00004 * math.cos(t)
            self.heading_deg = round((math.degrees(t) + 180) % 360, 1)

        elif self.status == "RETURNING":
            # Return to base
            d_lat = self.base_lat - self.lat
            d_lon = self.base_lon - self.lon
            dist_deg = math.sqrt(d_lat**2 + d_lon**2)
            dist_meters = dist_deg * 111000.0
            self.heading_deg = round((math.degrees(math.atan2(d_lon, d_lat)) + 360) % 360, 1)
            
            step_meters = 20.0 * dt
            if dist_meters <= step_meters:
                self.reset_to_base()
            else:
                ratio = step_meters / dist_meters
                self.lat += d_lat * ratio
                self.lon += d_lon * ratio

    def get_state(self) -> dict:
        return {
            "callsign": self.callsign,
            "status": self.status,
            "current_lat": round(self.lat, 6),
            "current_lon": round(self.lon, 6),
            "altitude_agl": round(self.altitude_agl, 1),
            "battery_pct": round(self.battery_pct, 1),
            "airspeed_mps": round(self.airspeed_mps, 1),
            "heading_deg": round(self.heading_deg, 1),
            "search_pattern": self.search_pattern,
            "search_progress_pct": round(self.search_progress_pct, 1),
            "target_locked": self.target_locked,
            "target_confidence": round(self.target_confidence, 1),
            "target_lat": self.target_lat,
            "target_lon": self.target_lon,
            "target_thermal_temp": self.target_thermal_temp
        }

uav_sim = UAVFlightSimulator()
