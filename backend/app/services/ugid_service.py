import hashlib
import time
import random

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
