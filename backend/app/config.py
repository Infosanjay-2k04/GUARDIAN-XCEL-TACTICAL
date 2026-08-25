import os

class Settings:
    PROJECT_NAME: str = "Guardian Xcel"
    VERSION: str = "1.0.0-PROTOTYPE"
    API_V1_STR: str = "/api/v1"
    
    # SQLite Database
    DATABASE_URL: str = "sqlite:///./guardian_xcel.db"
    
    # Demonstration Scenario Geographic Coordinates (Yosemite Valley Wilderness Zone)
    BASE_LAT: float = 37.7455
    BASE_LON: float = -119.5936
    
    # Key Landmarks
    RANGER_STATION_GPS = {"lat": 37.7485, "lon": -119.5870, "name": "Tactical Alpha Hub (Ranger HQ)"}
    UAV_HANGAR_GPS = {"lat": 37.7490, "lon": -119.5860, "name": "UAV Drone Base (Pad 01)"}
    RESCUE_STATION_GPS = {"lat": 37.7478, "lon": -119.5880, "name": "Ground Rescue Outpost (Unit Echo-4)"}
    DEFAULT_TOURIST_GPS = {"lat": 37.7420, "lon": -119.5975, "name": "Glacier Ridge Trail"}
    
    # Geofence Polygon (Safe Perimeter)
    GEOFENCE_SAFE_ZONE = [
        {"lat": 37.7520, "lon": -119.6050},
        {"lat": 37.7540, "lon": -119.5800},
        {"lat": 37.7380, "lon": -119.5780},
        {"lat": 37.7350, "lon": -119.6030}
    ]
    
    # Hazard / Cliff Zone (High Risk)
    GEOFENCE_HAZARD_ZONE = [
        {"lat": 37.7410, "lon": -119.6010},
        {"lat": 37.7435, "lon": -119.5960},
        {"lat": 37.7390, "lon": -119.5950},
        {"lat": 37.7375, "lon": -119.5995}
    ]

    # Simulation settings
    SIM_TICK_RATE_HZ: float = 5.0 # Broadcast rate
    IMMOBILITY_ALERT_SECONDS: int = 10 # Countdown before auto-emergency escalation
    UAV_SPEED_MPS: float = 24.0 # UAV flight speed in meters per second
    RESCUE_TEAM_SPEED_MPS: float = 12.0 # Ground vehicle speed in meters per second

settings = Settings()
