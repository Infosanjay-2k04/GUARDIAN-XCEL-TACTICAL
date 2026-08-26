import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSystem } from '../../context/SystemContext';

// Helper component to auto-fit Base Pad, UAV, Rescue Team and Victim on state transitions only
function DroneMapController({ uavPos, lkpPos, basePadPos, rescuePos, isFlying, isRescueActive }) {
  const map = useMap();
  const lastStateKeyRef = React.useRef('');

  useEffect(() => {
    if (!lkpPos || !basePadPos || !lkpPos[0] || !basePadPos[0]) return;

    const stateKey = `${isFlying ? 'FLY' : 'PAD'}_${isRescueActive ? 'RSC' : 'STN'}_${lkpPos[0].toFixed(3)}_${lkpPos[1].toFixed(3)}`;

    if (lastStateKeyRef.current !== stateKey) {
      lastStateKeyRef.current = stateKey;

      if (isFlying || isRescueActive) {
        // Ensure only valid local points within 2km are bounded
        const validPoints = [basePadPos, lkpPos, uavPos, rescuePos].filter(
          pt => pt && pt[0] <= 30 && pt[1] >= 0 && Math.abs(pt[0] - lkpPos[0]) < 0.02 && Math.abs(pt[1] - lkpPos[1]) < 0.02
        );
        if (validPoints.length >= 2) {
          const bounds = L.latLngBounds(validPoints);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: false });
          return;
        }
      }

      map.setView(lkpPos, 16, { animate: false });
    }
  }, [lkpPos?.[0], lkpPos?.[1], basePadPos?.[0], basePadPos?.[1], isFlying, isRescueActive, map]);

  return null;
}

export default function UAVSearchMap() {
  const { uav, active_incident, tourist, rescue_team, landmarks } = useSystem();

  const isFlying = uav.status !== 'STANDBY';
  const isRescueActive = ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'VICTIM_SECURED'].includes(rescue_team?.status);
  
  // Victim coordinates with regional safety validation
  const rawLkpLat = active_incident?.target_lat || active_incident?.lkp_lat || tourist?.current_lat || 11.3831;
  const rawLkpLon = active_incident?.target_lon || active_incident?.lkp_lon || tourist?.current_lon || 78.1626;
  const lkpLat = (rawLkpLat <= 30 && rawLkpLon >= 0) ? rawLkpLat : 11.3831;
  const lkpLon = (rawLkpLat <= 30 && rawLkpLon >= 0) ? rawLkpLon : 78.1626;

  // Dynamic Base Pad 01 and UAV Coordinates
  const padLat = landmarks?.uav_hangar?.lat || uav.base_lat || 11.3866;
  const padLon = landmarks?.uav_hangar?.lon || uav.base_lon || 78.1651;

  // When target locked, snap UAV position directly onto the red TARGET LKP marker
  const isTargetLockedOrFound = uav.target_locked || uav.status === 'TARGET_LOCKED';
  const rawUavLat = isTargetLockedOrFound ? lkpLat : (uav.current_lat || uav.telemetry?.current_lat || padLat);
  const rawUavLon = isTargetLockedOrFound ? lkpLon : (uav.current_lon || uav.telemetry?.current_lng || padLon);
  const uavLat = (rawUavLat <= 30 && rawUavLon >= 0) ? rawUavLat : padLat;
  const uavLon = (rawUavLat <= 30 && rawUavLon >= 0) ? rawUavLon : padLon;

  // Ground Rescue Team Echo-4 positioning & approach route
  const rescueOutpostLat = landmarks?.rescue_station?.lat || rescue_team?.base_lat || 11.3785;
  const rescueOutpostLon = landmarks?.rescue_station?.lon || rescue_team?.base_lon || 78.1595;
  const rescueLat = rescue_team?.current_lat || rescueOutpostLat;
  const rescueLon = rescue_team?.current_lon || rescueOutpostLon;

  const formatLat = (lat) => `${Math.abs(lat || 0).toFixed(4)}°${(lat || 0) >= 0 ? 'N' : 'S'}`;
  const formatLon = (lon) => `${Math.abs(lon || 0).toFixed(4)}°${(lon || 0) >= 0 ? 'E' : 'W'}`;

  // Custom DivIcon for UAV
  const createDroneIcon = (uavState) => {
    const heading = uavState.heading_deg || uavState.telemetry?.heading_deg || 0;
    const isLocked = uavState.target_locked;
    const color = isLocked ? '#00ff9d' : '#00f0ff';

    return L.divIcon({
      className: 'custom-uav-search-marker',
      html: `
        <div class="relative flex items-center justify-center w-12 h-12">
          <div class="absolute w-12 h-12 rounded-full border border-cyan-400/50 animate-ping opacity-50"></div>
          <div style="transform: rotate(${heading}deg); transition: transform 0.2s linear;">
            <svg class="w-8 h-8 filter drop-shadow(0 0 8px ${color})" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="absolute -bottom-4 bg-black/95 border border-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-cyan-glow">
            ${uavState.altitude_agl || 0}m | ${uavState.airspeed_mps || 0}m/s
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  };

  const createBasePadIcon = () => {
    return L.divIcon({
      className: 'custom-base-pad-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="w-5 h-5 rounded border-2 border-cyan-400 bg-cyan-950/90 flex items-center justify-center text-[8px] font-mono font-bold text-cyan-300 shadow-cyan-glow">
            H1
          </div>
          <div class="absolute -bottom-3.5 bg-black/90 border border-cyan-500/60 px-1 rounded text-[7px] font-mono text-cyan-200 whitespace-nowrap">
            BASE PAD 01
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createLkpIcon = () => {
    return L.divIcon({
      className: 'custom-lkp-search-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full border-2 border-rose-500 animate-ping opacity-80"></div>
          <div class="w-4 h-4 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-crimson-glow">
            LKP
          </div>
          <div class="absolute -bottom-3.5 bg-rose-950/90 border border-rose-500 px-1 rounded text-[7px] font-mono text-rose-200 whitespace-nowrap">
            TARGET LKP
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createVictimFoundIcon = () => {
    return L.divIcon({
      className: 'custom-victim-lock-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute w-10 h-10 rounded-full border-2 border-emerald-400 animate-ping opacity-80"></div>
          <div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-black shadow-emerald-glow">
            ✓
          </div>
          <div class="absolute -bottom-4 bg-emerald-950/95 border border-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-200 font-bold whitespace-nowrap shadow-emerald-glow">
            VICTIM LOCKED (36.8°C)
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  // Distinct Tactical SAR Ground Unit Marker (Echo-4)
  const createRescueTeamIcon = (rescueState) => {
    const isEnRoute = rescueState?.status === 'EN_ROUTE' || rescueState?.status === 'DISPATCHED';
    const isOnScene = rescueState?.status === 'ON_SCENE';
    const isSecured = rescueState?.status === 'VICTIM_SECURED';
    const color = isSecured ? '#00ff9d' : isOnScene ? '#00f0ff' : '#ffb700';
    const badgeLabel = isSecured 
      ? 'VICTIM_SECURED // TRIAGE_ACTIVE' 
      : isOnScene 
      ? 'ON SCENE (ECHO-4)' 
      : isEnRoute 
      ? `ECHO-4 (${rescueState?.eta_formatted || rescueState?.eta_seconds + 's'})` 
      : 'ECHO-4';

    return L.divIcon({
      className: 'custom-rescue-uav-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          ${isEnRoute ? `<div class="absolute w-10 h-10 rounded-full border-2 border-amber-400 animate-ping opacity-60"></div>` : ''}
          ${isOnScene || isSecured ? `<div class="absolute w-10 h-10 rounded-full border-2 border-emerald-400 animate-ping opacity-80"></div>` : ''}
          <div class="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] text-black shadow-lg" style="background-color: ${color}; border: 1.5px solid #fff;">
            🚑
          </div>
          <div class="absolute -bottom-4 bg-black/95 border px-1.5 py-0.5 rounded text-[7px] font-mono whitespace-nowrap font-bold shadow-md" style="color: ${color}; border-color: ${color};">
            ${badgeLabel}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  // Generate synthetic expanding square search pattern points around LKP for visual display
  const searchPatternPoints = [
    [lkpLat, lkpLon],
    [lkpLat + 0.0003, lkpLon],
    [lkpLat + 0.0003, lkpLon + 0.0004],
    [lkpLat - 0.0003, lkpLon + 0.0004],
    [lkpLat - 0.0003, lkpLon - 0.0005],
    [lkpLat + 0.0006, lkpLon - 0.0005],
    [lkpLat + 0.0006, lkpLon + 0.0008],
    [lkpLat - 0.0006, lkpLon + 0.0008]
  ];

  // Active mission flight vector connecting Base Pad 01 -> Current Drone -> Victim LKP
  const flightPath = isFlying ? [
    [padLat, padLon],
    [uavLat, uavLon],
    [lkpLat, lkpLon]
  ] : null;

  // Ground Rescue Pursuit Vector
  const rescuePath = isRescueActive ? [
    [rescueOutpostLat, rescueOutpostLon],
    [rescueLat, rescueLon],
    [lkpLat, lkpLon]
  ] : null;

  // Filter trail to avoid stale coordinates from different sectors (exclude lat > 30 or lng < 0)
  const cleanFlightTrail = (uav.flight_trail || []).filter(
    pt => pt && pt[0] <= 30 && pt[1] >= 0 && Math.abs(pt[0] - lkpLat) < 0.02 && Math.abs(pt[1] - lkpLon) < 0.02
  );

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <span className="flex items-center gap-1.5 text-tactical-cyan">
          <span className="w-2 h-2 rounded-full bg-tactical-cyan animate-pulse" />
          AUTONOMOUS SEARCH RADAR &amp; SECTOR MAP
        </span>
        <div className="flex items-center gap-2">
          {isRescueActive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold flex items-center gap-1">
              🚑 ECHO-4: {rescue_team.status} ({rescue_team.eta_formatted || rescue_team.eta_seconds + 's'})
            </span>
          )}
          <span className="text-[10px] text-tactical-muted">
            PATTERN: {uav.search_pattern}
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full min-h-[360px] rounded border border-tactical-border/80 overflow-hidden relative">
        {/* Radar concentric graphics overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-30 flex items-center justify-center">
          <div className="w-[420px] h-[420px] rounded-full border border-tactical-cyan/40" />
          <div className="w-[280px] h-[280px] rounded-full border border-tactical-cyan/30" />
          <div className="w-[140px] h-[140px] rounded-full border border-tactical-cyan/50" />
          <div className="absolute w-[420px] h-[420px] rounded-full border border-transparent border-t-tactical-cyan/80 animate-radar-sweep" />
        </div>

        {/* Map Telemetry Box Overlay */}
        <div className="absolute top-2 left-2 z-20 bg-tactical-darkest/95 border border-tactical-border px-2.5 py-1.5 rounded text-[10px] font-mono space-y-0.5">
          <div className="text-tactical-cyan font-bold">DRONE GPS: {formatLat(uavLat)}, {formatLon(uavLon)}</div>
          <div className="text-amber-400 font-bold">ECHO-4 SAR: {formatLat(rescueLat)}, {formatLon(rescueLon)}</div>
          <div className="text-slate-300">TARGET LKP: {formatLat(lkpLat)}, {formatLon(lkpLon)}</div>
          <div className="text-emerald-400 font-bold">AIR / GROUND STATUS: {uav.status} // {rescue_team?.status || 'STANDBY'}</div>
        </div>

        <MapContainer
          center={[11.3831, 78.1626]}
          zoom={16}
          scrollWheelZoom={true}
          className="w-full h-full min-h-[360px]"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <DroneMapController 
            uavPos={[uavLat, uavLon]} 
            lkpPos={[lkpLat, lkpLon]} 
            basePadPos={[padLat, padLon]}
            rescuePos={[rescueLat, rescueLon]}
            isFlying={isFlying}
            isRescueActive={isRescueActive}
          />

          {/* Dark CartoDB Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* Base Pad 01 Marker */}
          <Marker position={[padLat, padLon]} icon={createBasePadIcon()}>
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-cyan-400">BASE PAD 01</div>
                <div>Status: OPERATIONAL</div>
                <div>Coordinates: {formatLat(padLat)}, {formatLon(padLon)}</div>
              </div>
            </Popup>
          </Marker>

          {/* Search Radius Circle (120m search envelope) */}
          <Circle
            center={[lkpLat, lkpLon]}
            radius={120}
            pathOptions={{
              color: '#00f0ff',
              fillColor: '#00f0ff',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4'
            }}
          />

          {/* Expanding Square Search Pattern Trajectory Line */}
          {(uav.status === 'SEARCHING' || uav.status === 'TARGET_LOCKED') && (
            <Polyline
              positions={uav.search_waypoints && uav.search_waypoints.length > 0 ? uav.search_waypoints : searchPatternPoints}
              pathOptions={{
                color: '#00f0ff',
                weight: 1.5,
                dashArray: '4, 4',
                opacity: 0.75
              }}
            />
          )}

          {/* Real-time Breadcrumb Flight Trail Vector */}
          {cleanFlightTrail.length > 1 && (
            <Polyline
              positions={cleanFlightTrail}
              pathOptions={{
                color: '#38bdf8',
                weight: 2.5,
                opacity: 0.9
              }}
            />
          )}

          {/* Live Flight Vector from Base Pad -> Drone -> LKP */}
          {flightPath && (
            <Polyline
              positions={flightPath}
              pathOptions={{
                color: '#00f0ff',
                weight: 1.8,
                dashArray: '4, 4',
                opacity: 0.65
              }}
            />
          )}

          {/* Ground Rescue Approach Route (Amber Dashed) */}
          {rescuePath && (
            <Polyline
              positions={rescuePath}
              pathOptions={{
                color: '#ffb700',
                weight: 2.2,
                dashArray: '4, 4',
                opacity: 0.9
              }}
            />
          )}

          {/* LKP Target Marker */}
          <Marker position={[lkpLat, lkpLon]} icon={createLkpIcon()} />

          {/* Victim Locked Location Pin (when detected) */}
          {uav.target_locked && (
            <Marker
              position={[uav.target_lat || lkpLat, uav.target_lon || lkpLon]}
              icon={createVictimFoundIcon()}
            />
          )}

          {/* Ground Rescue Tactical Unit Echo-4 Marker */}
          <Marker
            position={[rescueLat, rescueLon]}
            icon={createRescueTeamIcon(rescue_team)}
          >
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-amber-400">{rescue_team?.team_callsign || 'TACTICAL SAR // ECHO-4'}</div>
                <div>Status: {rescue_team?.status}</div>
                <div>Speed: {rescue_team?.speed_kmh || ((rescue_team?.speed_mps || 0) * 3.6).toFixed(1)} km/h</div>
                <div>ETA: {rescue_team?.eta_formatted || rescue_team?.eta_seconds + 's'}</div>
                <div>Vehicle: {rescue_team?.unit_type}</div>
              </div>
            </Popup>
          </Marker>

          {/* Live UAV Marker */}
          <Marker
            position={[uavLat, uavLon]}
            icon={createDroneIcon(uav)}
          >
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-cyan-400">{uav.callsign}</div>
                <div>Status: {uav.status}</div>
                <div>Altitude: {uav.altitude_agl}m AGL</div>
                <div>Airspeed: {uav.airspeed_mps} m/s</div>
                <div>Battery: {uav.battery_pct}%</div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
