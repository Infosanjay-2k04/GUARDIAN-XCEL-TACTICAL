import math
import random
import time

class SensorSimulator:
    def __init__(self):
        self.mode = "NORMAL_WALK" # NORMAL_WALK, FALLING, IMMOBILE, MANUAL_SOS
        self.step_counter = 4120
        self.battery_pct = 94
        self.start_time = time.time()
        self.fall_timestamp = 0.0
        self.heart_rate = 76

    def set_mode(self, mode: str):
        self.mode = mode
        if mode == "FALLING":
            self.fall_timestamp = time.time()
            self.heart_rate = 122

    def tick(self) -> dict:
        """Computes a realistic 5Hz telemetry sample based on current behavioral state"""
        now = time.time()
        elapsed = now - self.start_time
        
        # Slight battery consumption over time
        if random.random() < 0.005 and self.battery_pct > 10:
            self.battery_pct -= 1

        if self.mode == "NORMAL_WALK":
            # Normal gait oscillation (approx 1.8 Hz)
            gait_freq = 1.8 * 2 * math.pi
            accel_x = 0.05 * math.sin(gait_freq * elapsed) + random.uniform(-0.02, 0.02)
            accel_y = 0.08 * math.cos(gait_freq * elapsed) + random.uniform(-0.02, 0.02)
            accel_z = 0.98 + 0.12 * math.sin(gait_freq * 2 * elapsed) + random.uniform(-0.03, 0.03)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            
            # Step increment
            if random.random() < 0.3:
                self.step_counter += 1
                
            self.heart_rate = int(75 + 4 * math.sin(elapsed * 0.1) + random.uniform(-2, 2))
            threat_level = "NORMAL"

        elif self.mode == "FALLING":
            # High impact spike (3.8g - 4.5g)
            accel_x = random.uniform(1.8, 2.4)
            accel_y = random.uniform(2.1, 3.2)
            accel_z = random.uniform(1.5, 2.8)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = int(125 + random.uniform(-3, 5))
            threat_level = "WARNING"
            
            # Transition to immobile after 1.5 seconds of fall impact
            if now - self.fall_timestamp > 1.5:
                self.mode = "IMMOBILE"

        elif self.mode == "IMMOBILE":
            # Zero movement with high/distressed heart rate
            accel_x = random.uniform(-0.005, 0.005)
            accel_y = random.uniform(-0.005, 0.005)
            accel_z = 0.99 + random.uniform(-0.005, 0.005)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = int(118 + random.uniform(-2, 3))
            threat_level = "CRITICAL"

        elif self.mode == "MANUAL_SOS":
            accel_x = random.uniform(-0.1, 0.1)
            accel_y = random.uniform(-0.1, 0.1)
            accel_z = 1.0 + random.uniform(-0.05, 0.05)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = 130
            threat_level = "CRITICAL"

        else:
            accel_x, accel_y, accel_z, g_force = 0.0, 0.0, 1.0, 1.0
            threat_level = "NORMAL"

        return {
            "accel_x": round(accel_x, 3),
            "accel_y": round(accel_y, 3),
            "accel_z": round(accel_z, 3),
            "g_force": round(g_force, 2),
            "heart_rate": self.heart_rate,
            "battery_pct": self.battery_pct,
            "step_counter": self.step_counter,
            "threat_level": threat_level,
            "mode": self.mode
        }

sensor_sim = SensorSimulator()
