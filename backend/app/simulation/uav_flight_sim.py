import math
import time
from typing import List, Tuple, Dict, Any
from app.config import settings

class UAVFlightSimulator:
    def __init__(self):
        self.callsign = "UAV-ALPHA // PHOENIX-1"
        self.model = "Tactical Hexacopter SAR (FLIR Boson 640)"
        self.status = "STANDBY" # STANDBY, TAKEOFF, EN_ROUTE_LKP, SEARCHING, TARGET_LOCKED, HOVER_BEACON, RETURNING, LANDED
        
        # Base Hangar Coordinates
        self.base_lat = settings.UAV_HANGAR_GPS["lat"]
        self.base_lon = settings.UAV_HANGAR_GPS["lon"]
        self.lat = self.base_lat
        self.lon = self.base_lon
        
        # Kinematics & Aerodynamics
        self.altitude_agl = 0.0 # meters AGL
        self.target_altitude = 45.0 # meters
        self.climb_rate_mps = 0.0 # m/s
        self.airspeed_mps = 0.0 # m/s
        self.max_airspeed = 24.0 # m/s (~86.4 km/h)
        self.acceleration_mps2 = 6.0 # m/s^2
        self.heading_deg = 0.0 # yaw in degrees true north
        self.target_heading_deg = 0.0
        self.pitch_deg = 0.0 # nose down/up
        self.roll_deg = 0.0 # banking angle
        self.throttle_pct = 0.0 # 0 - 100%
        self.battery_pct = 98.5 # %
        
        # Angular rates for MAVLink ATTITUDE
        self.roll_rate = 0.0
        self.pitch_rate = 0.0
        self.yaw_rate = 0.0
        
        # Mission Navigation Targets
        self.target_lkp_lat = None
        self.target_lkp_lon = None
        self.search_pattern = "EXPANDING_SQUARE"
        self.search_progress_pct = 0.0
        self.search_start_time = 0.0
        self.search_waypoint_idx = 0
        self.search_waypoints: List[Tuple[float, float]] = []
        
        # Flight Breadcrumb Trail
        self.flight_trail: List[List[float]] = []
        self.last_trail_time = 0.0
        
        # Detection lock
        self.target_locked = False
        self.target_confidence = 0.0
        self.target_lat = None
        self.target_lon = None
        self.target_thermal_temp = 0.0
        
        # MAVLink Mission Index
        self.mission_seq = 0
        self.total_mission_seq = 8

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates exact geodesic distance in meters using Haversine formula"""
        R = 6371000.0 # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def _calculate_bearing(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates true geographic bearing from point 1 to point 2 via spherical trigonometry"""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360.0) % 360.0

    def _generate_expanding_square_waypoints(self, center_lat: float, center_lon: float) -> List[Tuple[float, float]]:
        """Generates systematic expanding square search legs (20m, 40m, 60m, 80m, 100m, 120m)"""
        waypoints = []
        cur_lat, cur_lon = center_lat, center_lon
        
        # Conversion: 1 degree lat ~ 111,111m, 1 degree lon ~ 111,111 * cos(lat)
        m_per_deg_lat = 111111.0
        m_per_deg_lon = 111111.0 * math.cos(math.radians(center_lat))
        
        # Directions: North, East, South, West (90° shifts)
        directions = [
            (1, 0),   # North
            (0, 1),   # East
            (-1, 0),  # South
            (0, -1)   # West
        ]
        
        leg_distances = [20, 20, 40, 40, 60, 60, 80, 80, 100, 100, 120, 120]
        dir_idx = 0
        
        for d in leg_distances:
            d_north, d_east = directions[dir_idx % 4]
            cur_lat += (d_north * d) / m_per_deg_lat
            cur_lon += (d_east * d) / m_per_deg_lon
            waypoints.append((round(cur_lat, 7), round(cur_lon, 7)))
            dir_idx += 1
            
        return waypoints

    def dispatch_to_lkp(self, lkp_lat: float, lkp_lon: float):
        """Commands UAV to take off and transit to Last Known Position (LKP) with safe coordinate validation"""
        # Validate coordinates to prevent NaN / Undefined
        if lkp_lat is None or math.isnan(float(lkp_lat)) or float(lkp_lat) == 0.0:
            lkp_lat = settings.DEFAULT_TOURIST_GPS["lat"]
        if lkp_lon is None or math.isnan(float(lkp_lon)) or float(lkp_lon) == 0.0:
            lkp_lon = settings.DEFAULT_TOURIST_GPS["lon"]

        self.status = "EN_ROUTE_LKP"
        self.target_lkp_lat = float(lkp_lat)
        self.target_lkp_lon = float(lkp_lon)
        self.search_progress_pct = 0.0
        self.target_locked = False
        self.target_confidence = 0.0
        self.search_waypoint_idx = 0
        self.search_waypoints = self._generate_expanding_square_waypoints(self.target_lkp_lat, self.target_lkp_lon)
        self.flight_trail = [[round(self.lat, 6), round(self.lon, 6)]]
        self.mission_seq = 1
        self.target_heading_deg = self._calculate_bearing(self.lat, self.lon, self.target_lkp_lat, self.target_lkp_lon)

    def start_expanding_square_search(self):
        """Initiates autonomous expanding square search grid around LKP"""
        if not self.target_lkp_lat:
            self.target_lkp_lat = self.lat
            self.target_lkp_lon = self.lon
        self.status = "SEARCHING"
        self.search_start_time = time.time()
        self.search_waypoints = self._generate_expanding_square_waypoints(self.target_lkp_lat, self.target_lkp_lon)
        self.search_waypoint_idx = 0
        self.mission_seq = 2

    def trigger_thermal_lock(self):
        """Engages AI thermal object detection lock on victim coordinates"""
        self.target_locked = True
        self.status = "TARGET_LOCKED"
        self.target_confidence = 97.6
        self.target_lat = round(self.target_lkp_lat if self.target_lkp_lat else self.lat, 6)
        self.target_lon = round(self.target_lkp_lon if self.target_lkp_lon else self.lon, 6)
        self.target_thermal_temp = 36.8
        self.mission_seq = 3

    def lock_target(self):
        """Alias for trigger_thermal_lock"""
        self.trigger_thermal_lock()

    def return_to_base(self):
        """Commands UAV to initiate RTL back to Base Pad 01"""
        self.status = "RETURNING"
        self.target_heading_deg = self._calculate_bearing(self.lat, self.lon, self.base_lat, self.base_lon)

    def reset_to_base(self):
        self.status = "STANDBY"
        self.lat = self.base_lat
        self.lon = self.base_lon
        self.altitude_agl = 0.0
        self.battery_pct = 98.5
        self.airspeed_mps = 0.0
        self.heading_deg = 0.0
        self.pitch_deg = 0.0
        self.roll_deg = 0.0
        self.throttle_pct = 0.0
        self.target_lkp_lat = None
        self.target_lkp_lon = None
        self.search_progress_pct = 0.0
        self.target_locked = False
        self.target_confidence = 0.0
        self.target_lat = None
        self.target_lon = None
        self.target_thermal_temp = 0.0
        self.flight_trail = []
        self.mission_seq = 0

    def reset_uav(self):
        """Alias for reset_to_base"""
        self.reset_to_base()

    def tick(self, dt: float = 0.2):
        """Updates full 6-DOF kinematics, aerodynamics, and MAVLink telemetry at 5Hz"""
        now = time.time()
        
        if self.status == "STANDBY":
            self.airspeed_mps = 0.0
            self.altitude_agl = 0.0
            self.throttle_pct = 0.0
            self.pitch_deg = 0.0
            self.roll_deg = 0.0
            return

        # 1. Flight Breadcrumb Trail Recording (every 0.5s)
        if now - self.last_trail_time >= 0.5:
            self.last_trail_time = now
            self.flight_trail.append([round(self.lat, 6), round(self.lon, 6)])
            if len(self.flight_trail) > 120:
                self.flight_trail.pop(0)

        # 2. Dynamic Battery Consumption based on throttle and airspeed
        drain_rate = 0.008 + (self.throttle_pct / 100.0) * 0.015
        self.battery_pct = max(3.0, round(self.battery_pct - drain_rate * dt, 2))

        # 3. Altitude Climb / Descent Profiles
        if self.status in ["EN_ROUTE_LKP", "RETURNING"]:
            target_alt = 45.0
        elif self.status in ["SEARCHING", "TARGET_LOCKED"]:
            target_alt = 30.0 # Low-altitude thermal sweep
        else:
            target_alt = 0.0

        alt_err = target_alt - self.altitude_agl
        if abs(alt_err) > 0.5:
            self.climb_rate_mps = math.copysign(min(6.0, abs(alt_err) * 1.5), alt_err)
            self.altitude_agl = max(0.0, round(self.altitude_agl + self.climb_rate_mps * dt, 1))
            self.pitch_deg = round(self.climb_rate_mps * 2.2, 1) # Pitch up on climb
        else:
            self.climb_rate_mps = 0.0
            self.pitch_deg = round(self.airspeed_mps * -0.35, 1) # Slight nose-down in forward flight

        # 4. State-Specific Navigation & Waypoint Tracking
        if self.status == "EN_ROUTE_LKP" and self.target_lkp_lat is not None:
            # Accelerate smoothly to max tactical cruise speed (24 m/s)
            self.airspeed_mps = min(self.max_airspeed, self.airspeed_mps + self.acceleration_mps2 * dt)
            self.throttle_pct = round((self.airspeed_mps / self.max_airspeed) * 85.0 + 10.0, 1)
            
            # Calculate distance and bearing
            dist_meters = self._haversine_distance(self.lat, self.lon, self.target_lkp_lat, self.target_lkp_lon)
            self.target_heading_deg = self._calculate_bearing(self.lat, self.lon, self.target_lkp_lat, self.target_lkp_lon)
            
            # Smooth heading turn interpolation
            heading_diff = (self.target_heading_deg - self.heading_deg + 180) % 360 - 180
            turn_step = math.copysign(min(45.0 * dt, abs(heading_diff)), heading_diff)
            self.heading_deg = (self.heading_deg + turn_step) % 360.0
            self.roll_deg = round(turn_step * 1.2, 1) # Aerodynamic banking angle

            step_meters = self.airspeed_mps * dt
            if dist_meters <= step_meters * 1.8:
                # Reached LKP -> engage expanding square search grid
                self.lat = self.target_lkp_lat
                self.lon = self.target_lkp_lon
                self.start_expanding_square_search()
            else:
                ratio = step_meters / max(1.0, dist_meters)
                self.lat += (self.target_lkp_lat - self.lat) * ratio
                self.lon += (self.target_lkp_lon - self.lon) * ratio

        elif self.status == "SEARCHING":
            # Tactical search flight mode (14 m/s at 30m AGL)
            self.airspeed_mps = 14.0
            self.throttle_pct = 62.0
            self.search_progress_pct = min(100.0, round(self.search_progress_pct + 4.5 * dt, 1))

            if self.search_waypoints and self.search_waypoint_idx < len(self.search_waypoints):
                wp_lat, wp_lon = self.search_waypoints[self.search_waypoint_idx]
                dist_wp = self._haversine_distance(self.lat, self.lon, wp_lat, wp_lon)
                self.target_heading_deg = self._calculate_bearing(self.lat, self.lon, wp_lat, wp_lon)

                # Turn towards next search leg waypoint
                heading_diff = (self.target_heading_deg - self.heading_deg + 180) % 360 - 180
                turn_step = math.copysign(min(60.0 * dt, abs(heading_diff)), heading_diff)
                self.heading_deg = (self.heading_deg + turn_step) % 360.0
                self.roll_deg = round(turn_step * 1.4, 1)

                step_meters = self.airspeed_mps * dt
                if dist_wp <= step_meters * 1.5:
                    self.search_waypoint_idx += 1
                else:
                    ratio = step_meters / max(1.0, dist_wp)
                    self.lat += (wp_lat - self.lat) * ratio
                    self.lon += (wp_lon - self.lon) * ratio

            # Automatic AI Thermal Target Lock after initial grid scan
            if self.search_progress_pct >= 55.0 and not self.target_locked:
                self.trigger_thermal_lock()

        elif self.status == "TARGET_LOCKED":
            # Coordinated circular surveillance orbit over confirmed victim
            self.airspeed_mps = 6.0
            self.throttle_pct = 48.0
            self.target_confidence = min(99.4, round(self.target_confidence + 0.1 * dt, 1))
            
            # 15m radius orbit at 30m altitude
            t = now * 0.6
            orbit_rad = 15.0 / 111111.0
            self.lat = (self.target_lat or self.lat) + orbit_rad * math.sin(t)
            self.lon = (self.target_lon or self.lon) + (orbit_rad / math.cos(math.radians(self.lat))) * math.cos(t)
            self.heading_deg = (math.degrees(t) + 90.0) % 360.0
            self.roll_deg = -15.0 # Inward surveillance bank

        elif self.status == "RETURNING":
            self.airspeed_mps = 20.0
            self.throttle_pct = 78.0
            dist_base = self._haversine_distance(self.lat, self.lon, self.base_lat, self.base_lon)
            self.target_heading_deg = self._calculate_bearing(self.lat, self.lon, self.base_lat, self.base_lon)

            heading_diff = (self.target_heading_deg - self.heading_deg + 180) % 360 - 180
            turn_step = math.copysign(min(45.0 * dt, abs(heading_diff)), heading_diff)
            self.heading_deg = (self.heading_deg + turn_step) % 360.0
            self.roll_deg = round(turn_step * 1.1, 1)

            step_meters = self.airspeed_mps * dt
            if dist_base <= step_meters * 1.5:
                self.reset_to_base()
            else:
                ratio = step_meters / max(1.0, dist_base)
                self.lat += (self.base_lat - self.lat) * ratio
                self.lon += (self.base_lon - self.lon) * ratio

    def get_state(self) -> Dict[str, Any]:
        """Returns comprehensive UAV avionics, search progress, breadcrumbs, and MAVLink packets"""
        return {
            "callsign": self.callsign,
            "model": self.model,
            "status": self.status,
            "current_lat": round(self.lat, 6),
            "current_lon": round(self.lon, 6),
            "altitude_agl": round(self.altitude_agl, 1),
            "battery_pct": round(self.battery_pct, 1),
            "airspeed_mps": round(self.airspeed_mps, 1),
            "ground_speed_mps": round(self.airspeed_mps, 1),
            "heading_deg": round(self.heading_deg, 1),
            "pitch_deg": round(self.pitch_deg, 1),
            "roll_deg": round(self.roll_deg, 1),
            "climb_rate_mps": round(self.climb_rate_mps, 2),
            "energy_consumption_wh_per_km": round(
                ((21.6 + (self.battery_pct / 100.0) * 3.6) * (12.4 + (self.throttle_pct / 100.0) * 28.0)) / max(1.0, self.airspeed_mps * 3.6), 1
            ) if self.airspeed_mps > 1.0 else 0.0,
            "haversine_distance_to_target_m": round(
                self._haversine_distance(self.lat, self.lon, self.target_lkp_lat or self.lat, self.target_lkp_lon or self.lon), 1
            ),
            "isrid_model": {
                "victim_category": "HIKER_TREKKER",
                "p25_radius_m": 400,
                "p50_radius_m": 800,
                "p75_radius_m": 1500,
                "priority_sector": "INNER_CORE_P25",
                "statistical_source": "International Search & Rescue Incident Database (ISRID v2.0)"
            },
            "search_pattern": self.search_pattern,
            "search_progress_pct": round(self.search_progress_pct, 1),
            "target_locked": self.target_locked,
            "target_confidence": round(self.target_confidence, 1),
            "target_lat": self.target_lat,
            "target_lon": self.target_lon,
            "target_thermal_temp": self.target_thermal_temp,
            "flight_trail": self.flight_trail,
            "search_waypoints": self.search_waypoints,
            "mavlink": {
                "SYS_STATUS": {
                    "voltage_battery": round(21.6 + (self.battery_pct / 100.0) * 3.6, 2),
                    "current_battery": round(12.4 + (self.throttle_pct / 100.0) * 28.0, 1),
                    "battery_remaining": int(self.battery_pct),
                    "drop_rate_comm": 0,
                    "errors_comm": 0
                },
                "ATTITUDE": {
                    "roll_deg": round(self.roll_deg, 1),
                    "pitch_deg": round(self.pitch_deg, 1),
                    "yaw_deg": round(self.heading_deg, 1),
                    "rollspeed": round(self.roll_rate, 2),
                    "pitchspeed": round(self.pitch_rate, 2),
                    "yawspeed": round(self.yaw_rate, 2)
                },
                "GLOBAL_POSITION_INT": {
                    "lat": int(self.lat * 1e7),
                    "lon": int(self.lon * 1e7),
                    "alt_mm": int(self.altitude_agl * 1000),
                    "relative_alt_mm": int(self.altitude_agl * 1000),
                    "vx": round(self.airspeed_mps * math.cos(math.radians(self.heading_deg)), 2),
                    "vy": round(self.airspeed_mps * math.sin(math.radians(self.heading_deg)), 2),
                    "vz": round(-self.climb_rate_mps, 2),
                    "hdg_cdeg": int(self.heading_deg * 100)
                },
                "MISSION_CURRENT": {
                    "seq": self.mission_seq,
                    "total_seq": self.total_mission_seq,
                    "nav_mode": self.status,
                    "throttle_pct": round(self.throttle_pct, 1)
                }
            }
        }

uav_sim = UAVFlightSimulator()
