import os

class Settings:
    PROJECT_NAME: str = "Guardian Xcel"
    VERSION: str = "1.0.0-PROTOTYPE"
    API_V1_STR: str = "/api/v1"
    
    # SQLite Database
    DATABASE_URL: str = "sqlite:///./guardian_xcel.db"
    
    # Active Tactical Geographic Anchor
    DEFAULT_TOURIST_GPS = {"lat": 11.3995, "lon": 78.1614, "name": "Sector Alpha Active Zone"}
    BASE_LAT: float = 11.3995 + 0.0035 # 11.4030
    BASE_LON: float = 78.1614 + 0.0025 # 78.1639
    
    # Key Landmarks
    RANGER_STATION_GPS = {"lat": 11.4035, "lon": 78.1645, "name": "Tactical Alpha Hub (Ranger HQ)"}
    UAV_HANGAR_GPS = {"lat": 11.4030, "lon": 78.1639, "name": "UAV Drone Base (Pad 01)"}
    RESCUE_STATION_GPS = {"lat": 11.4025, "lon": 78.1642, "name": "Ground Rescue Outpost (Unit Echo-4)"}
    
    # Geofence Polygon (Safe Perimeter)
    GEOFENCE_SAFE_ZONE = [
        {"lat": 11.4080, "lon": 78.1500},
        {"lat": 11.4095, "lon": 78.1700},
        {"lat": 11.3920, "lon": 78.1710},
        {"lat": 11.3900, "lon": 78.1510}
    ]
    
    # Hazard / Cliff Zone (High Risk)
    GEOFENCE_HAZARD_ZONE = [
        {"lat": 11.3985, "lon": 78.1580},
        {"lat": 11.4010, "lon": 78.1630},
        {"lat": 11.3965, "lon": 78.1640},
        {"lat": 11.3950, "lon": 78.1595}
    ]

    # Simulation settings
    SIM_TICK_RATE_HZ: float = 5.0 # Broadcast rate
    IMMOBILITY_ALERT_SECONDS: int = 10 # Countdown before auto-emergency escalation
    UAV_SPEED_MPS: float = 24.0 # UAV flight speed in meters per second
    RESCUE_TEAM_SPEED_MPS: float = 12.0 # Ground vehicle speed in meters per second

settings = Settings()
