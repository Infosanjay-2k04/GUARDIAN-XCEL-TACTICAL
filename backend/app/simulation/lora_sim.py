import random
import time

class LoRaSimulator:
    def __init__(self):
        self.primary_channel = "CELLULAR_4G" # CELLULAR_4G, LORA_MESH, OFFLINE
        self.cellular_rssi_dbm = -78
        self.lora_snr_db = 8.5
        self.packet_counter = 1042
        self.hop_count = 1

    def set_channel(self, channel: str):
        self.primary_channel = channel
        if channel == "LORA_MESH":
            self.cellular_rssi_dbm = -124 # Severely attenuated cellular signal
            self.lora_snr_db = random.uniform(5.5, 9.2)
            self.hop_count = 2
        elif channel == "CELLULAR_4G":
            self.cellular_rssi_dbm = random.randint(-82, -74)
            self.hop_count = 1

    def tick(self) -> dict:
        now = time.time()
        self.packet_counter += 1
        
        if self.primary_channel == "CELLULAR_4G":
            status_text = "4G LTE HIGH BANDWIDTH (RELAY DIRECT)"
            packet_loss_pct = 0.2
            rssi = self.cellular_rssi_dbm + random.randint(-2, 2)
            active_protocol = "HTTPS / WSS JSON"
        elif self.primary_channel == "LORA_MESH":
            status_text = "LORA 868MHz LONG-RANGE MESH (NODE RE-ROUTED)"
            packet_loss_pct = 2.4
            rssi = -118 + random.randint(-3, 3)
            active_protocol = "LORA BINARY COMPRESSED (24-BYTE PAYLOAD)"
        else:
            status_text = "COMMUNICATION LINK DOWN // BUFFERING LOCALLY"
            packet_loss_pct = 100.0
            rssi = -140
            active_protocol = "OFFLINE BUFFER"

        return {
            "channel": self.primary_channel,
            "status_text": status_text,
            "cellular_rssi_dbm": rssi,
            "lora_snr_db": round(self.lora_snr_db, 1),
            "packet_counter": self.packet_counter,
            "hop_count": self.hop_count,
            "active_protocol": active_protocol,
            "packet_loss_pct": packet_loss_pct
        }

lora_sim = LoRaSimulator()
