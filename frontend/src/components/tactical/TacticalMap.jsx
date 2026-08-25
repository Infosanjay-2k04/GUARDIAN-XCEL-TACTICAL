import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSystem } from '../../context/SystemContext';

// Helper component to smoothly center/pan map on active incident or selected tourist
function MapController({ targetPos, isEmergency }) {
  const map = useMap();
  useEffect(() => {
    if (targetPos && targetPos[0] && targetPos[1]) {
      map.setView(targetPos, isEmergency ? 15 : 14, { animate: true, duration: 1.0 });
    }
  }, [targetPos, isEmergency, map]);
  return null;
}

export default function TacticalMap({ embedded = false }) {
  const { 
    tourist, 
    tourists_list, 
    uav, 
    rescue_team, 
    active_incident, 
    selectedUgid, 
    setSelectedUgid,
    geofence_safe,
    geofence_hazard,
    landmarks
  } = useSystem();

  // Create custom DivIcons for high-tech tactical rendering
  const createTouristIcon = (t, isSelected) => {
    const isCritical = t.threat_level === 'CRITICAL';
    const isWarning = t.threat_level === 'WARNING';
    const color = isCritical ? '#ff2255' : isWarning ? '#ffb700' : '#00ff9d';
    const pulseAnim = isCritical ? 'animate-ping' : '';

    return L.divIcon({
      className: 'custom-tactical-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
          ${isCritical ? `<div class="absolute w-10 h-10 rounded-full border-2 border-rose-500 animate-ping opacity-60"></div>` : ''}
          ${isSelected ? `<div class="absolute w-8 h-8 rounded-full border-2 border-cyan-400 opacity-80"></div>` : ''}
          <div class="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center font-bold text-[8px] text-black shadow-lg" style="background-color: ${color};">
            ${isCritical ? '!' : 'T'}
          </div>
          <div class="absolute -bottom-3.5 bg-black/90 border ${isCritical ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'} px-1 rounded text-[8px] font-mono whitespace-nowrap shadow">
            ${t.ugid}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createUavIcon = (uavState) => {
    const heading = uavState.heading_deg || 0;
    const isLocked = uavState.target_locked;
    const color = isLocked ? '#00ff9d' : '#00f0ff';

    return L.divIcon({
      className: 'custom-uav-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute w-10 h-10 rounded-full border border-cyan-400/40 animate-ping opacity-30"></div>
          <div style="transform: rotate(${heading}deg); transition: transform 0.25s linear;">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="absolute -bottom-3.5 bg-black/95 border border-cyan-500/80 px-1 rounded text-[8px] font-mono text-cyan-300 whitespace-nowrap shadow-cyan-glow">
            ${uavState.altitude_agl}m AGL
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const createRescueTeamIcon = (rescueState) => {
    return L.divIcon({
      className: 'custom-rescue-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="w-5 h-5 rounded bg-amber-500 border border-black flex items-center justify-center font-bold text-[9px] text-black shadow-amber-glow">
            E4
          </div>
          <div class="absolute -bottom-3.5 bg-black/90 border border-amber-500/60 px-1 rounded text-[8px] font-mono text-amber-300 whitespace-nowrap">
            ${rescueState.team_callsign || 'ECHO-4'}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createLandmarkIcon = (label, color = '#64748b') => {
    return L.divIcon({
      className: 'custom-landmark-marker',
      html: `
        <div class="flex flex-col items-center">
          <div class="w-2.5 h-2.5 rounded-full border border-white/60" style="background-color: ${color};"></div>
          <div class="bg-black/80 px-1 rounded text-[7px] font-mono text-slate-300 whitespace-nowrap mt-0.5">
            ${label}
          </div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 5]
    });
  };

  const createLkpIcon = () => {
    return L.divIcon({
      className: 'custom-lkp-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full border-2 border-rose-500 animate-ping opacity-70"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[7px] font-bold text-white">
            LKP
          </div>
          <div class="absolute -bottom-3.5 bg-rose-950/90 border border-rose-500 px-1 rounded text-[7px] font-mono text-rose-200 whitespace-nowrap">
            LAST KNOWN POS
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const defaultCenter = [tourist.current_lat, tourist.current_lon];

  // Geofence Polygons dynamically calibrated to current tourist anchor
  const safeCoords = geofence_safe || [
    [tourist.current_lat + 0.0080, tourist.current_lon - 0.0120],
    [tourist.current_lat + 0.0095, tourist.current_lon + 0.0090],
    [tourist.current_lat - 0.0075, tourist.current_lon + 0.0105],
    [tourist.current_lat - 0.0090, tourist.current_lon - 0.0110]
  ];

  const hazardCoords = geofence_hazard || [
    [tourist.current_lat - 0.0010, tourist.current_lon - 0.0035],
    [tourist.current_lat + 0.0015, tourist.current_lon + 0.0015],
    [tourist.current_lat - 0.0030, tourist.current_lon + 0.0025],
    [tourist.current_lat - 0.0045, tourist.current_lon - 0.0020]
  ];

  // Flight vectors
  const uavVector = uav.status !== 'STANDBY' ? [
    [uav.current_lat, uav.current_lon],
    [active_incident?.target_lat || active_incident?.lkp_lat || tourist.current_lat, active_incident?.target_lon || active_incident?.lkp_lon || tourist.current_lon]
  ] : null;

  const rescueVector = (rescue_team.status === 'DISPATCHED' || rescue_team.status === 'ON_SCENE') ? [
    [rescue_team.current_lat, rescue_team.current_lon],
    [active_incident?.target_lat || tourist.current_lat, active_incident?.target_lon || tourist.current_lon]
  ] : null;

  // Selected or active emergency tourist position
  const selectedT = tourists_list?.find(t => t.ugid === selectedUgid) || tourist;
  const isEmergencyActive = active_incident !== null && active_incident !== undefined;
  const focusPos = isEmergencyActive 
    ? [active_incident.lkp_lat, active_incident.lkp_lon]
    : [selectedT.current_lat, selectedT.current_lon];

  return (
    <div className="relative w-full h-full min-h-[420px] rounded border border-tactical-border/80 overflow-hidden bg-tactical-darkest">
      {/* Tactical Radar Overlay Graphic */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-25">
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          {/* Concentric rings */}
          <div className="absolute w-[500px] h-[500px] rounded-full border border-tactical-cyan/30" />
          <div className="absolute w-[340px] h-[340px] rounded-full border border-tactical-cyan/20" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-tactical-cyan/40" />
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-tactical-cyan/20" />
          <div className="absolute h-full w-[1px] bg-tactical-cyan/20" />
          {/* Animated radar sweep line */}
          <div className="absolute w-[500px] h-[500px] rounded-full border border-transparent border-t-tactical-cyan/60 animate-radar-sweep" />
        </div>
      </div>

      {/* Map Header Overlay */}
      <div className="absolute top-2 left-2 z-20 bg-tactical-darkest/90 border border-tactical-border/80 px-2.5 py-1.5 rounded backdrop-blur text-[10px] font-mono flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-white font-bold">
          <span className="w-2 h-2 rounded-full bg-tactical-cyan animate-pulse" />
          TACTICAL RADAR GIS // SECTOR YOSEMITE-ALPHA
        </span>
        <span className="text-tactical-muted hidden sm:inline">
          FOCUS: {selectedT.ugid} ({selectedT.current_lat.toFixed(4)}°N, {Math.abs(selectedT.current_lon).toFixed(4)}°W)
        </span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-2 left-2 z-20 bg-tactical-darkest/90 border border-tactical-border/80 p-2 rounded backdrop-blur text-[9px] font-mono space-y-1">
        <div className="text-slate-400 font-bold border-b border-tactical-border/50 pb-0.5">MAP LAYERS</div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 border border-emerald-400 bg-emerald-950/40 rounded-xs" />
          SAFE GEOFENCE PERIMETER
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="w-2.5 h-2.5 border border-rose-500 bg-rose-950/40 rounded-xs" />
          CLIFF HAZARD RISK ZONE
        </div>
        <div className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-0.5 bg-cyan-400" />
          UAV VECTOR & SEARCH RADIUS
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[420px]"
        zoomControl={!embedded}
      >
        <MapController targetPos={focusPos} isEmergency={isEmergencyActive} />

        {/* Free Dark CartoDB Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Safe Geofence Polygon */}
        <Polygon
          positions={safeCoords}
          pathOptions={{
            color: '#00ff9d',
            fillColor: '#00ff9d',
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: '4, 4'
          }}
        />

        {/* Hazard Zone Polygon */}
        <Polygon
          positions={hazardCoords}
          pathOptions={{
            color: '#ff2255',
            fillColor: '#ff2255',
            fillOpacity: 0.12,
            weight: 1.5
          }}
        />

        {/* Landmarks */}
        {landmarks?.ranger_hq && (
          <Marker position={[landmarks.ranger_hq.lat, landmarks.ranger_hq.lon]} icon={createLandmarkIcon('RANGER HQ', '#38bdf8')} />
        )}
        {landmarks?.uav_hangar && (
          <Marker position={[landmarks.uav_hangar.lat, landmarks.uav_hangar.lon]} icon={createLandmarkIcon('UAV PAD 01', '#00f0ff')} />
        )}
        {landmarks?.rescue_station && (
          <Marker position={[landmarks.rescue_station.lat, landmarks.rescue_station.lon]} icon={createLandmarkIcon('RESCUE OUTPOST', '#fbbf24')} />
        )}

        {/* All Monitored Tourists */}
        {tourists_list?.map(t => (
          <Marker
            key={t.ugid}
            position={[t.current_lat, t.current_lon]}
            icon={createTouristIcon(t, t.ugid === selectedUgid)}
            eventHandlers={{
              click: () => setSelectedUgid(t.ugid)
            }}
          >
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-cyan-400">{t.full_name}</div>
                <div>UGID: {t.ugid}</div>
                <div>Status: {t.threat_level}</div>
                <div>HR: {t.heart_rate} BPM | Battery: {t.battery_pct}%</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Last Known Position (LKP) Pin if active emergency */}
        {active_incident && (
          <Marker position={[active_incident.lkp_lat, active_incident.lkp_lon]} icon={createLkpIcon()} />
        )}

        {/* UAV Marker */}
        {uav.status !== 'STANDBY' && (
          <Marker position={[uav.current_lat, uav.current_lon]} icon={createUavIcon(uav)}>
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-cyan-400">{uav.callsign}</div>
                <div>Status: {uav.status}</div>
                <div>Altitude: {uav.altitude_agl}m | Battery: {uav.battery_pct}%</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ground Rescue Team Marker */}
        <Marker position={[rescue_team.current_lat, rescue_team.current_lon]} icon={createRescueTeamIcon(rescue_team)}>
          <Popup>
            <div className="font-mono text-xs p-1">
              <div className="font-bold text-amber-400">{rescue_team.team_callsign}</div>
              <div>Status: {rescue_team.status}</div>
              <div>Speed: {rescue_team.speed_mps} m/s | ETA: {rescue_team.eta_seconds}s</div>
            </div>
          </Popup>
        </Marker>

        {/* Flight & Rescue Trajectory Vectors */}
        {uavVector && (
          <Polyline
            positions={uavVector}
            pathOptions={{ color: '#00f0ff', weight: 2, dashArray: '6, 6', opacity: 0.8 }}
          />
        )}

        {rescueVector && (
          <Polyline
            positions={rescueVector}
            pathOptions={{ color: '#ffb700', weight: 2, dashArray: '4, 4', opacity: 0.9 }}
          />
        )}

        {/* ISRID Statistical Search Rings (25%, 50%, 75% Probability Envelopes) */}
        {active_incident && (
          <>
            {/* 75% Outer Envelope */}
            <Circle
              center={[active_incident.lkp_lat, active_incident.lkp_lon]}
              radius={650}
              pathOptions={{
                color: '#60a5fa',
                fillColor: '#60a5fa',
                fillOpacity: 0.03,
                weight: 1,
                dashArray: '6, 6'
              }}
            />
            {/* 50% Mid Envelope */}
            <Circle
              center={[active_incident.lkp_lat, active_incident.lkp_lon]}
              radius={350}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#38bdf8',
                fillOpacity: 0.06,
                weight: 1.2,
                dashArray: '4, 4'
              }}
            />
            {/* 25% High-Probability Core (ISRID Hiker Priority 1) */}
            <Circle
              center={[active_incident.lkp_lat, active_incident.lkp_lon]}
              radius={150}
              pathOptions={{
                color: '#00f0ff',
                fillColor: '#00f0ff',
                fillOpacity: 0.14,
                weight: 1.8,
                dashArray: '2, 2'
              }}
            />
          </>
        )}

        {/* Search Radius Circle if UAV is searching */}
        {uav.status === 'SEARCHING' && (
          <Circle
            center={[active_incident?.lkp_lat || tourist.current_lat, active_incident?.lkp_lon || tourist.current_lon]}
            radius={90}
            pathOptions={{ color: '#00f0ff', fillColor: '#00f0ff', fillOpacity: 0.18, weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
