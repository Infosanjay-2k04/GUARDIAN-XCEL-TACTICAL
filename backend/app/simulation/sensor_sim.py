import math
import random
import time

class SensorSimulator:
    def __init__(self):
        self.mode = "NORMAL_WALK" # NORMAL_WALK, ABNORMAL, FALLING, IMMOBILE, MANUAL_SOS
        self.step_counter = 4120
        self.battery_pct = 94
        self.start_time = time.time()
        self.fall_timestamp = 0.0
        self.heart_rate = 76
        self.live_override = False
        self.last_live_time = 0.0
        self.live_ax = 0.02
        self.live_ay = 0.04
        self.live_az = 0.99
        self.live_g = 1.0
        self.signal_loss_index = 0.0 # 0.0 = 4G LTE, 0.75 = LoRa fallback, 1.0 = Out of Range

    def update_live_telemetry(self, ax: float, ay: float, az: float, g: float):
        self.live_override = True
        self.last_live_time = time.time()
        self.live_ax = ax or 0.0
        self.live_ay = ay or 0.0
        self.live_az = az or 0.98
        self.live_g = g or 1.0

    def update_live_battery(self, battery_pct: int, charging: bool = False):
        if battery_pct is not None:
            self.battery_pct = max(0, min(100, int(battery_pct)))

    def set_mode(self, mode: str):
        self.mode = mode
        self.live_override = False
        if mode == "FALLING":
            self.fall_timestamp = time.time()
            self.heart_rate = 122
        elif mode == "ABNORMAL":
            self.heart_rate = 108
        elif mode == "IMMOBILE":
            self.heart_rate = 118
        elif mode == "MANUAL_SOS":
            self.heart_rate = 132

    def tick(self) -> dict:
        """
        Computes a realistic 5Hz telemetry sample and evaluates the mathematical Risk Engine:
        R = (0.35 * A_norm) + (0.25 * V_spike) + (0.15 * Delta_Orientation) + (0.15 * Signal_Loss) + (0.10 * Battery_Critical)
        """
        now = time.time()
        elapsed = now - self.start_time
        
        # Micro battery consumption
        if random.random() < 0.005 and self.battery_pct > 10:
            self.battery_pct -= 1

        if self.mode == "NORMAL_WALK":
            if self.live_override and (now - self.last_live_time < 3.0):
                accel_x = self.live_ax
                accel_y = self.live_ay
                accel_z = self.live_az
                g_force = self.live_g
            else:
                gait_freq = 1.8 * 2 * math.pi
                accel_x = 0.05 * math.sin(gait_freq * elapsed) + random.uniform(-0.02, 0.02)
                accel_y = 0.08 * math.cos(gait_freq * elapsed) + random.uniform(-0.02, 0.02)
                accel_z = 0.98 + 0.12 * math.sin(gait_freq * 2 * elapsed) + random.uniform(-0.03, 0.03)
                g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            
            if random.random() < 0.3:
                self.step_counter += 1
                
            self.heart_rate = int(75 + 4 * math.sin(elapsed * 0.1) + random.uniform(-2, 2))
            self.signal_loss_index = 0.05

        elif self.mode == "ABNORMAL":
            accel_x = random.uniform(-0.8, 0.9)
            accel_y = random.uniform(-0.7, 1.2)
            accel_z = 0.95 + random.uniform(-0.6, 0.8)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = int(108 + random.uniform(-4, 6))
            self.signal_loss_index = 0.25

        elif self.mode == "FALLING":
            accel_x = random.uniform(1.8, 2.4)
            accel_y = random.uniform(2.1, 3.2)
            accel_z = random.uniform(1.5, 2.8)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = int(125 + random.uniform(-3, 5))
            self.signal_loss_index = 0.40
            
            if now - self.fall_timestamp > 1.5:
                self.mode = "IMMOBILE"

        elif self.mode == "IMMOBILE":
            accel_x = random.uniform(-0.005, 0.005)
            accel_y = random.uniform(-0.005, 0.005)
            accel_z = 0.99 + random.uniform(-0.005, 0.005)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = int(118 + random.uniform(-2, 3))
            self.signal_loss_index = 0.65

        elif self.mode == "MANUAL_SOS":
            accel_x = random.uniform(-0.1, 0.1)
            accel_y = random.uniform(-0.1, 0.1)
            accel_z = 1.0 + random.uniform(-0.05, 0.05)
            g_force = math.sqrt(accel_x**2 + accel_y**2 + accel_z**2)
            self.heart_rate = 130
            self.signal_loss_index = 0.75

        else:
            accel_x, accel_y, accel_z, g_force = 0.0, 0.0, 1.0, 1.0
            self.signal_loss_index = 0.0

        # === MATHEMATICAL MULTI-VARIABLE RISK ENGINE ===
        # 1. A_norm: Acceleration anomaly from 1.0g baseline [0.0 - 1.0]
        if self.mode == "IMMOBILE":
            a_norm = 0.85 # Sustained zero movement after event
        else:
            a_norm = min(1.0, abs(g_force - 1.0) / 2.5)

        # 2. V_spike: Sudden impact / velocity jerk spike [0.0 - 1.0]
        if g_force > 1.4:
            v_spike = min(1.0, (g_force - 1.4) / 2.6)
        else:
            v_spike = 0.0

        # 3. Delta_Orientation: Posture tumble deviation from vertical Z-axis [0.0 - 1.0]
        horizontal_accel = math.sqrt(accel_x**2 + accel_y**2)
        delta_orientation = min(1.0, horizontal_accel / 1.5)

        # 4. Signal_Loss: Comms link degradation index [0.0 - 1.0]
        signal_loss = min(1.0, self.signal_loss_index)

        # 5. Battery_Critical: Low battery emergency multiplier [0.0 - 1.0]
        if self.battery_pct < 20:
            battery_critical = (20 - self.battery_pct) / 20.0
        else:
            battery_critical = 0.0

        # Master Risk Formula: R = 0.35*A_norm + 0.25*V_spike + 0.15*Delta_Orientation + 0.15*Signal_Loss + 0.10*Battery_Critical
        if self.mode == "MANUAL_SOS":
            risk_score = 0.985
            threat_level = "CRITICAL"
        else:
            risk_score = (
                0.35 * a_norm +
                0.25 * v_spike +
                0.15 * delta_orientation +
                0.15 * signal_loss +
                0.10 * battery_critical
            )
            risk_score = min(1.0, max(0.0, risk_score))

            if risk_score >= 0.70 or self.mode in ["FALLING", "IMMOBILE"]:
                threat_level = "CRITICAL"
            elif risk_score >= 0.35 or self.mode == "ABNORMAL":
                threat_level = "WARNING"
            else:
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
            "mode": self.mode,
            "risk_score": round(risk_score, 3),
            "risk_factors": {
                "a_norm": round(a_norm, 3),
                "v_spike": round(v_spike, 3),
                "delta_orientation": round(delta_orientation, 3),
                "signal_loss": round(signal_loss, 3),
                "battery_critical": round(battery_critical, 3),
                "formula": "R = 0.35*A + 0.25*V + 0.15*Δθ + 0.15*Sig + 0.10*Bat"
            }
        }

sensor_sim = SensorSimulator()
