import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSystem } from '../../context/SystemContext';

// Helper component to keep target victim LKP and UAV in active mission viewport focus
function DroneMapController({ uavPos, lkpPos, isFlying }) {
  const map = useMap();
  useEffect(() => {
    if (lkpPos && lkpPos[0] && lkpPos[1]) {
      map.setView(lkpPos, 16, { animate: true, duration: 0.8 });
    } else if (uavPos && uavPos[0] && uavPos[1]) {
      map.setView(uavPos, 16, { animate: true, duration: 0.8 });
    }
  }, [lkpPos?.[0], lkpPos?.[1], isFlying, map]);
  return null;
}

export default function UAVSearchMap() {
  const { uav, active_incident, tourist } = useSystem();

  const isFlying = uav.status !== 'STANDBY';
  const lkpLat = active_incident?.target_lat || active_incident?.lkp_lat || tourist?.current_lat || 37.7420;
  const lkpLon = active_incident?.target_lon || active_incident?.lkp_lon || tourist?.current_lon || -119.5975;

  const uavLat = uav.current_lat || lkpLat + 0.0018;
  const uavLon = uav.current_lon || lkpLon + 0.0022;

  const formatLat = (lat) => `${Math.abs(lat || 0).toFixed(4)}°${(lat || 0) >= 0 ? 'N' : 'S'}`;
  const formatLon = (lon) => `${Math.abs(lon || 0).toFixed(4)}°${(lon || 0) >= 0 ? 'E' : 'W'}`;

  // Custom DivIcon for UAV
  const createDroneIcon = (uavState) => {
    const heading = uavState.heading_deg || 0;
    const isLocked = uavState.target_locked;
    const color = isLocked ? '#00ff9d' : '#00f0ff';

    return L.divIcon({
      className: 'custom-uav-search-marker',
      html: `
        <div class="relative flex items-center justify-center w-12 h-12">
          <div class="absolute w-12 h-12 rounded-full border border-cyan-400/50 animate-ping opacity-40"></div>
          <div style="transform: rotate(${heading}deg); transition: transform 0.2s linear;">
            <svg class="w-8 h-8 filter drop-shadow(0 0 6px ${color})" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="absolute -bottom-4 bg-black/95 border border-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow-cyan-glow">
            ${uavState.altitude_agl}m | ${uavState.airspeed_mps}m/s
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
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

  // Flight trajectory from drone to LKP
  const flightPath = isFlying ? [
    [uavLat, uavLon],
    [lkpLat, lkpLon]
  ] : null;

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <span className="flex items-center gap-1.5 text-tactical-cyan">
          <span className="w-2 h-2 rounded-full bg-tactical-cyan animate-pulse" />
          AUTONOMOUS SEARCH RADAR &amp; SECTOR MAP
        </span>
        <span className="text-[10px] text-tactical-muted">
          PATTERN: {uav.search_pattern}
        </span>
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
          <div className="text-slate-300">TARGET LKP: {formatLat(lkpLat)}, {formatLon(lkpLon)}</div>
          <div className="text-amber-400 font-bold">MODE: {uav.status}</div>
        </div>

        <MapContainer
          center={[lkpLat, lkpLon]}
          zoom={16}
          scrollWheelZoom={true}
          className="w-full h-full min-h-[360px]"
        >
          <DroneMapController 
            uavPos={[uavLat, uavLon]} 
            lkpPos={[lkpLat, lkpLon]} 
            isFlying={isFlying} 
          />

          {/* Dark CartoDB Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

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
          {uav.flight_trail && uav.flight_trail.length > 1 && (
            <Polyline
              positions={uav.flight_trail}
              pathOptions={{
                color: '#38bdf8',
                weight: 2.5,
                opacity: 0.9
              }}
            />
          )}

          {/* Live Flight Vector from Drone to LKP */}
          {flightPath && (
            <Polyline
              positions={flightPath}
              pathOptions={{
                color: '#00f0ff',
                weight: 1.5,
                dashArray: '2, 3',
                opacity: 0.5
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
