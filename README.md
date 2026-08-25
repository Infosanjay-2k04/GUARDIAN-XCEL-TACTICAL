# GUARDIAN XCEL // TACTICAL HUB
### Autonomous AI-Based Tourist Emergency Detection & Drone-Assisted Rescue Coordination System

**Guardian Xcel** is a zero-budget, competition-grade emergency command-and-control system and autonomous drone search-and-rescue (SAR) platform.

---

## 4 Connected Real-Time Interfaces

### 1. Tactical Command Center (`/tactical`)
- **Top:** Tactical Command Center header with live system time, DEFCON status, network/uplink state, and master demo triggers.
- **Left Panel (Tourist Monitoring):**
  - Summary metrics: `TOTAL TOURISTS`, `SAFE` (Green), `AT RISK` (Amber), `EMERGENCY` (Red).
  - Registered beacon list (`GX-8921-ALPHA`, `GX-4412-BRAVO`, `GX-1109-DELTA`, `GX-7723-SIERRA`) with live vitals.
  - Selected Tourist Inspector: Full profile, medical notes, emergency contacts, exact GPS, 3-axis accelerometer telemetry.
- **Center Panel (Live Terrain Map):**
  - Leaflet GIS map with Dark Matter tiles and tactical radar sweep overlay.
  - Renders all registered tourist markers with color-coded threat states.
  - Auto-centers and highlights victim marker with glowing pulse beacon during emergency.
  - Safe geofencing perimeter & cliff hazard danger zones.
  - UAV position, flight vector, and Ground Rescue Unit (`Echo-4`) route vector.
  - Last Known Position (LKP) target marker.
- **Right Panel (Active Incident):**
  - Active incident number, target UGID, threat level badge, incident trigger type.
  - LKP coordinates, detection timestamp, communication mode (Cellular vs LoRa Failover).
  - Assigned UAV (`UAV-ALPHA // PHOENIX-1`) and Ground Rescue Team (`GROUND ECHO-4`).
  - Tactical command override buttons: `SCRAMBLE UAV`, `DISPATCH RESCUE`, `RESOLVE`.
- **Bottom Panel (Live Event Timeline):**
  - Timestamped chronological cryptographic event stream.
  - Communication status indicators: `ONLINE`, `WEBSOCKET: 5Hz`, `LORA FALLBACK: ACTIVE/STANDBY`, `OFFLINE`.

### 2. UAV Operations & Search Center (`/uav`)
- **Header:** Drone mission control header with assigned sector callout and satellite RTK GNSS fix.
- **Left Panel (Drone Fleet):**
  - Telemetry cards for `DRONE-01` (Primary Tactical SAR), `DRONE-02` (LoRa Mesh Relay), `DRONE-03` (Long-Range Thermal Scout).
  - Live battery %, voltage, GPS coordinates, altitude (AGL), airspeed, signal strength (dBm), and current mission.
- **Center Panel (UAV Search Map):**
  - Specialized search map with UAV position, heading orientation, target LKP, search envelope radius (120m), expanding square search pattern trajectory, and victim location lock.
- **Right Panel (Mission Control & FLIR Thermal Search):**
  - Live distance-to-target countdown, search progress %, and rescue handoff indicator.
  - Mission Controls: `DISPATCH UAV`, `START SEARCH`, `THERMAL SCAN`, `RETURN TO BASE (RTL)`.
  - **Simulated FLIR Thermal Search Feed:** HTML5 Canvas Ironbow infrared stream with terrain noise, search sweeps, candidate evaluations, and AI bounding box target lock (`HUMAN_BIO_SIGNATURE [36.8°C] 97.6% CONFIDENCE`).

### 3. Guardian Xcel Mobile (`/mobile`)
- Tourist-facing PWA layout with Auto-Location, Radar Linked, UGID badge, dynamic threat gauge, 3-axis accelerometer waveform, interactive simulation buttons, and live rescue status HUD.

### 4. Master Presentation Command Deck (`/deck`)
- Unified 3-in-1 cyber-command screen embedding the actual `/mobile`, `/tactical`, and `/uav` components.
- Top master control bar with "RUN FULL RESCUE DEMO" and 10-step sequential progression tracker.

---

## 10-Step Automated Rescue Demonstration Lifecycle

Clicking **"RUN FULL RESCUE DEMO"** executes the end-to-end emergency pipeline:

1. `NORMAL TOURIST` — Baseline telemetry streaming (1.0g gait, 76 BPM, 4G LTE).
2. `FALL IMPACT` — High-G impact spike (3.8g) detected.
3. `INACTIVITY CONFIRMED` — Zero motion sustained $\rightarrow$ Auto-emergency generated.
4. `UGID VERIFIED & LORA FAILOVER` — Cellular drops $\rightarrow$ Automatic switch to 868MHz LoRa mesh packet protocol.
5. `TACTICAL HUB TRIAGE` — Incident opened in Tactical Command Center; nearest UAV assigned.
6. `UAV DISPATCHED` — `UAV-Alpha Phoenix-1` scrambles from Pad 01 to LKP (24 m/s, 45m AGL).
7. `EXPANDING SEARCH PATTERN` — UAV reaches LKP and initiates expanding search sweep.
8. `THERMAL TARGET LOCK` — FLIR sensor locks victim heat signature (36.8°C, 97.6% confidence).
9. `GROUND RESCUE DISPATCHED` — `Echo-4` tactical team rolls to target with live ETA countdown; mobile displays incoming rescue status.
10. `VICTIM SECURED & RESOLVED` — Tourist secured, first aid administered, system restored to normal.

---

## Quick Start Guide

### 1. Launch Backend
```bash
cd backend
python run_backend.py
```
*Backend runs on `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`).*

### 2. Launch Frontend
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Windows One-Click Launcher
Double-click `start_guardian_xcel.bat` or run `start_guardian_xcel.ps1` in PowerShell.
