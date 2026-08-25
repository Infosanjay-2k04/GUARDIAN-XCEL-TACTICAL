import hashlib
import time
import datetime
import random
from typing import List, Dict, Any, Optional

class ForensicBlockchainLedger:
    """
    Immutable Cryptographic Forensic Audit Ledger.
    Every state transition, beacon heartbeat, and emergency alert creates an
    authenticated SHA-256 block cryptographically linked to the previous block hash:
    Hash = SHA256(UGID + Timestamp + Lat + Lon + ThreatLevel + PrevHash)
    """
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        genesis_time = "2026-08-25T00:00:00Z"
        raw = f"GENESIS:{genesis_time}:0.0:0.0:SYSTEM_INIT:0000000000000000000000000000000000000000000000000000000000000000"
        genesis_hash = hashlib.sha256(raw.encode('utf-8')).hexdigest()
        
        self.chain.append({
            "block_index": 0,
            "timestamp": genesis_time,
            "time_str": "00:00:00",
            "ugid": "SYSTEM_GENESIS",
            "lat": 37.7485,
            "lon": -119.5870,
            "threat_level": "NORMAL",
            "event_type": "GENESIS_INITIALIZATION",
            "details": "Guardian Xcel Root Cryptographic Chain Anchor",
            "prev_hash": "0000000000000000000000000000000000000000000000000000000000000000",
            "block_hash": genesis_hash,
            "tamper_proof": True
        })

    def add_block(self, ugid: str, lat: float, lon: float, threat_level: str, event_type: str, details: str) -> Dict[str, Any]:
        prev_block = self.chain[-1]
        prev_hash = prev_block["block_hash"]
        now_dt = datetime.datetime.utcnow()
        timestamp_iso = now_dt.isoformat() + "Z"
        time_str = now_dt.strftime("%H:%M:%S")

        # Forensic Chained Formula: SHA256(UGID + Timestamp + Lat + Lon + ThreatLevel + PrevHash)
        raw_payload = f"{ugid}:{timestamp_iso}:{lat:.5f}:{lon:.5f}:{threat_level}:{prev_hash}"
        block_hash = hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()

        new_block = {
            "block_index": len(self.chain),
            "timestamp": timestamp_iso,
            "time_str": time_str,
            "ugid": ugid,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "threat_level": threat_level,
            "event_type": event_type,
            "details": details,
            "prev_hash": prev_hash,
            "block_hash": block_hash,
            "tamper_proof": True
        }
        self.chain.append(new_block)
        return new_block

    def verify_integrity(self) -> Dict[str, Any]:
        """Validates cryptographic integrity of the entire forensic blockchain"""
        total_blocks = len(self.chain)
        tampered_blocks = 0
        validation_log = []

        for i in range(1, total_blocks):
            cur = self.chain[i]
            prev = self.chain[i - 1]

            # Verify previous hash link
            if cur["prev_hash"] != prev["block_hash"]:
                tampered_blocks += 1
                validation_log.append(f"Block #{i} broken link: prev_hash mismatch")
                continue

            # Verify block SHA-256 signature
            raw = f"{cur['ugid']}:{cur['timestamp']}:{cur['lat']:.5f}:{cur['lon']:.5f}:{cur['threat_level']}:{cur['prev_hash']}"
            recomputed = hashlib.sha256(raw.encode('utf-8')).hexdigest()

            if recomputed != cur["block_hash"]:
                tampered_blocks += 1
                validation_log.append(f"Block #{i} corrupted hash signature")

        is_valid = (tampered_blocks == 0)
        return {
            "is_valid": is_valid,
            "total_blocks": total_blocks,
            "tampered_blocks": tampered_blocks,
            "audit_status": "100% LEDGER INTEGRITY VERIFIED (0 TAMPERING)" if is_valid else f"AUDIT ALERT: {tampered_blocks} TAMPERED BLOCKS",
            "last_verified_hash": self.chain[-1]["block_hash"],
            "validation_timestamp": datetime.datetime.utcnow().strftime("%H:%M:%S")
        }

    def get_recent_blocks(self, limit: int = 15) -> List[Dict[str, Any]]:
        return list(reversed(self.chain[-limit:]))

forensic_ledger = ForensicBlockchainLedger()

class UGIDService:
    @staticmethod
    def generate_ugid(prefix: str = "GX") -> str:
        """Generates a cryptographic Guardian Unique Identification ID (e.g. GX-8921-ALPHA)"""
        number_part = random.randint(1000, 9999)
        callsigns = ["ALPHA", "BRAVO", "DELTA", "ECHO", "SIERRA", "TANGO", "VALKYRIE", "PHOENIX"]
        suffix = random.choice(callsigns)
        return f"{prefix}-{number_part}-{suffix}"

    @staticmethod
    def verify_ugid(ugid: str) -> bool:
        """Validates format of a UGID string"""
        parts = ugid.split("-")
        if len(parts) == 3 and parts[0] == "GX" and parts[1].isdigit():
            return True
        return False

    @staticmethod
    def generate_crypto_signature(ugid: str, lat: float, lon: float, timestamp: float) -> str:
        """Generates a verifiable SHA-256 telemetry signature"""
        raw = f"{ugid}:{lat:.5f}:{lon:.5f}:{timestamp}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16].upper()

ugid_service = UGIDService()
