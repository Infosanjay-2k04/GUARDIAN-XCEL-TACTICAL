import math
import random
import time

class ThermalVisionSimulator:
    def __init__(self):
        self.ambient_temp_c = 14.5 # Ambient terrain temperature in Celsius
        self.victim_temp_c = 36.8 # Human core body temperature
        self.active_palette = "IRONBOW" # IRONBOW, WHITE_HOT, BLACK_HOT
        self.gimbal_pitch_deg = -65.0
        self.zoom_level = 2.0

    def generate_thermal_frame_metadata(self, uav_status: str, target_locked: bool, search_progress: float) -> dict:
        """Generates AI bounding box coordinates, thermal temperature distribution, and telemetry for canvas rendering"""
        now = time.time()
        
        # Simulating bounding box tracking on victim
        if target_locked:
            # High confidence locked box in center of FLIR FOV
            jitter_x = 0.5 * math.sin(now * 2.0)
            jitter_y = 0.5 * math.cos(now * 2.0)
            
            box = {
                "visible": True,
                "x_pct": round(50.0 + jitter_x, 2), # Center percentage
                "y_pct": round(50.0 + jitter_y, 2),
                "width_pct": 14.0,
                "height_pct": 22.0,
                "label": "HUMAN_BIO_SIGNATURE",
                "confidence_pct": round(96.8 + random.uniform(-0.5, 0.8), 1),
                "core_temp_c": round(self.victim_temp_c + random.uniform(-0.2, 0.2), 1),
                "status": "TARGET_LOCKED"
            }
        elif uav_status == "SEARCHING":
            # Scanning / searching state with transient candidate heat blips
            has_candidate = search_progress > 30.0 and random.random() < 0.4
            box = {
                "visible": has_candidate,
                "x_pct": round(random.uniform(30.0, 70.0), 2),
                "y_pct": round(random.uniform(30.0, 70.0), 2),
                "width_pct": 10.0,
                "height_pct": 16.0,
                "label": "ANOMALY_HEAT_CLUSTER",
                "confidence_pct": round(random.uniform(45.0, 68.0), 1),
                "core_temp_c": round(random.uniform(22.0, 28.0), 1),
                "status": "EVALUATING"
            }
        else:
            box = {
                "visible": False,
                "x_pct": 50.0,
                "y_pct": 50.0,
                "width_pct": 0.0,
                "height_pct": 0.0,
                "label": "STANDBY",
                "confidence_pct": 0.0,
                "core_temp_c": self.ambient_temp_c,
                "status": "IDLE"
            }

        return {
            "ambient_temp_c": self.ambient_temp_c,
            "max_detected_temp_c": round(self.victim_temp_c if target_locked else self.ambient_temp_c + 4.0, 1),
            "gimbal_pitch_deg": self.gimbal_pitch_deg,
            "zoom_level": self.zoom_level,
            "palette": self.active_palette,
            "bounding_box": box
        }

thermal_sim = ThermalVisionSimulator()
