import struct
import random
import time
import binascii

class LoRaBinaryCodec:
    """
    24-Byte Compact Binary LoRa Mesh Codec.
    Encodes/Decodes real-time sensor packets into ultra-compact 24-byte binary structs:
    Format: [HEADER (2B) | UGID_HASH (4B) | TIMESTAMP (4B) | LAT_INT (4B) | LON_INT (4B) | THREAT (1B) | BATTERY (1B) | HR (1B) | FLAGS (1B) | CRC16 (2B)]
    Total: 24 Bytes.
    """
    STRUCT_FORMAT = "!2sIIiiBBBBH" # 2+4+4+4+4+1+1+1+1+2 = 24 Bytes

    @staticmethod
    def _compute_crc16(data: bytes) -> int:
        crc = 0xFFFF
        for b in data:
            crc ^= (b << 8)
            for _ in range(8):
                if crc & 0x8000:
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF
                else:
                    crc = (crc << 1) & 0xFFFF
        return crc

    @classmethod
    def encode_packet(cls, ugid: str, timestamp_sec: int, lat: float, lon: float, threat_level: str, battery_pct: int, heart_rate: int) -> dict:
        header = b"GX"
        ugid_numeric = int(binascii.crc32(ugid.encode('utf-8')) & 0xFFFFFFFF)
        lat_int = int(lat * 1e7)
        lon_int = int(lon * 1e7)
        
        threat_code = 0
        if threat_level == "WARNING":
            threat_code = 1
        elif threat_level == "CRITICAL":
            threat_code = 2
            
        battery_byte = max(0, min(100, int(battery_pct)))
        hr_byte = max(0, min(255, int(heart_rate)))
        flags = 0x01 # Mesh relayed flag

        # Pack 22 bytes before CRC
        raw_body = struct.pack("!2sIIiiBBBB", header, ugid_numeric, timestamp_sec, lat_int, lon_int, threat_code, battery_byte, hr_byte, flags)
        crc = cls._compute_crc16(raw_body)
        raw_24b = raw_body + struct.pack("!H", crc)

        hex_str = "0x" + raw_24b.hex().upper()
        
        # Calculate LoRa Time-on-Air (ToA) for SF9 / 125kHz / CR 4/5 / Preamble 8
        # Symbol duration Ts = 2^SF / BW = 512 / 125000 = 4.096 ms
        # Preamble duration = (8 + 4.25) * 4.096 = 50.18 ms
        # Payload symbols ~ 33 -> Payload duration ~ 135.17 ms
        # Total ToA = 185.35 ms
        toa_ms = 185.4

        return {
            "raw_hex": hex_str,
            "byte_length": len(raw_24b),
            "crc16": f"0x{crc:04X}",
            "toa_ms": toa_ms,
            "spreading_factor": "SF9",
            "bandwidth_khz": 125,
            "coding_rate": "4/5",
            "frequency_mhz": 868.100,
            "mesh_relayed": True
        }

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

    def tick(self, lat: float = 37.7420, lon: float = -119.5975, threat_level: str = "NORMAL", battery_pct: int = 94, heart_rate: int = 76) -> dict:
        now = time.time()
        self.packet_counter += 1
        timestamp_sec = int(now)
        
        # Binary 24-byte packet generation
        binary_packet = LoRaBinaryCodec.encode_packet(
            ugid="GX-8921-ALPHA",
            timestamp_sec=timestamp_sec,
            lat=lat,
            lon=lon,
            threat_level=threat_level,
            battery_pct=battery_pct,
            heart_rate=heart_rate
        )

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
            "packet_loss_pct": packet_loss_pct,
            "lora_binary_packet": binary_packet
        }

lora_sim = LoRaSimulator()
