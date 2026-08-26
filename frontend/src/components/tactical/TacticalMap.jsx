import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSystem } from '../../context/SystemContext';

// Helper component to smoothly center/pan map on state transitions only (preventing animation queue overflows)
function MapController({ targetPos, isEmergency, uavPos, isUavFlying }) {
  const map = useMap();
  const lastStateKeyRef = React.useRef('');
  const lastTargetPosRef = React.useRef(null);

  useEffect(() => {
    if (!targetPos || !targetPos[0] || !targetPos[1]) return;

    const stateKey = `${isEmergency ? 'EMG' : 'NORM'}_${isUavFlying ? 'FLY' : 'PAD'}_${targetPos[0].toFixed(3)}_${targetPos[1].toFixed(3)}`;
    
    // Only re-fit or re-center if emergency/flight status changes or target moves > 500m
    const hasTargetShifted = !lastTargetPosRef.current ||
      Math.abs(lastTargetPosRef.current[0] - targetPos[0]) > 0.005 ||
      Math.abs(lastTargetPosRef.current[1] - targetPos[1]) > 0.005;

    if (lastStateKeyRef.current !== stateKey || hasTargetShifted) {
      lastStateKeyRef.current = stateKey;
      lastTargetPosRef.current = targetPos;

      if (isEmergency && isUavFlying && uavPos && uavPos[0]) {
        const validPoints = [targetPos, uavPos].filter(
          pt => pt && pt[0] <= 30 && pt[1] >= 0 && Math.abs(pt[0] - targetPos[0]) < 0.02 && Math.abs(pt[1] - targetPos[1]) < 0.02
        );
        if (validPoints.length >= 2) {
          const bounds = L.latLngBounds(validPoints);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: false });
          return;
        }
      }

      map.setView(targetPos, isEmergency ? 16 : 15, { animate: false });
    }
  }, [targetPos?.[0], targetPos?.[1], isEmergency, isUavFlying, map]);

  return null;
}

export default function TacticalMap({ embedded = false }) {
  const {
    tourist,
    tourists_list,
    active_incident,
    uav,
    rescue_team,
    geofence_safe,
    geofence_hazard,
    landmarks,
    selectedUgid,
    setSelectedUgid
  } = useSystem();

  // Custom DivIcons with responsive tactical styling
  const createTouristIcon = (touristData, isSelected) => {
    const isThreat = touristData.threat_level === 'CRITICAL' || touristData.threat_level === 'WARNING';
    const color = touristData.threat_level === 'CRITICAL' ? '#ff2255' : touristData.threat_level === 'WARNING' ? '#ffb700' : '#00ff9d';
    
    return L.divIcon({
      className: 'custom-tourist-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          ${isThreat ? `<div class="absolute w-8 h-8 rounded-full border-2 border-rose-500 animate-ping opacity-80"></div>` : ''}
          ${isSelected ? `<div class="absolute w-7 h-7 rounded-full border border-cyan-400 animate-pulse"></div>` : ''}
          <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg" style="background-color: ${color};"></div>
          <div class="absolute -bottom-3 bg-black/90 px-1 rounded text-[7px] font-mono text-white whitespace-nowrap border border-slate-700">
            ${touristData.ugid.split('-')[2] || 'UNIT'}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const createUavIcon = (uavState) => {
    const heading = uavState.heading_deg || uavState.telemetry?.heading_deg || 0;
    const isLocked = uavState.target_locked;
    const color = isLocked ? '#00ff9d' : '#00f0ff';

    return L.divIcon({
      className: 'custom-uav-marker',
      html: `
        <div class="relative flex items-center justify-center w-12 h-12">
          <div class="absolute w-12 h-12 rounded-full border border-cyan-400/60 animate-ping opacity-60"></div>
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/20 animate-pulse"></div>
          <div style="transform: rotate(${heading}deg); transition: transform 0.25s linear;">
            <svg class="w-7 h-7 filter drop-shadow(0 0 8px ${color})" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="absolute -bottom-3.5 bg-black/95 border border-cyan-400 px-1 py-0.2 rounded text-[7px] font-mono text-cyan-300 whitespace-nowrap shadow-cyan-glow">
            ${uavState.callsign?.split('//')[0] || 'UAV'} (${uavState.altitude_agl || 0}m)
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  };

  // Ground Tactical SAR Unit Marker (Echo-4) with Real-Time Heading Orientation
  const createRescueTeamIcon = (rescueState, targetCoordinates) => {
    const isEnRoute = rescueState.status === 'EN_ROUTE' || rescueState.status === 'DISPATCHED';
    const isOnScene = rescueState.status === 'ON_SCENE';
    const isSecured = rescueState.status === 'VICTIM_SECURED';
    const color = isSecured ? '#00ff9d' : isOnScene ? '#00f0ff' : '#ffb700';

    // Calculate vehicle heading dynamically towards target
    let heading = rescueState.heading_deg || 0;
    if (isEnRoute && targetCoordinates && rescueState.current_lat) {
      const dLat = targetCoordinates[0] - rescueState.current_lat;
      const dLon = targetCoordinates[1] - rescueState.current_lon;
      heading = Math.round((Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360);
    }

    const badgeLabel = isSecured 
      ? 'VICTIM_SECURED // TRIAGE_ACTIVE' 
      : isOnScene 
      ? 'ON SCENE (ECHO-4)' 
      : isEnRoute 
      ? `ECHO-4 (${rescueState.eta_formatted || rescueState.eta_seconds + 's'})` 
      : (rescueState.team_callsign || 'ECHO-4');

    return L.divIcon({
      className: 'custom-rescue-marker',
      html: `
        <div class="relative flex items-center justify-center w-12 h-12">
          ${isEnRoute ? `<div class="absolute w-12 h-12 rounded-full border-2 border-amber-400 animate-ping opacity-60"></div>` : ''}
          ${isOnScene || isSecured ? `<div class="absolute w-12 h-12 rounded-full border-2 border-emerald-400 animate-ping opacity-80"></div>` : ''}
          <div style="transform: rotate(${heading}deg); transition: transform 0.25s linear;">
            <div class="w-7 h-7 rounded-md flex items-center justify-center font-bold text-[12px] text-black shadow-lg" style="background-color: ${color}; border: 1.5px solid #fff;">
              🚑
            </div>
          </div>
          <div class="absolute -bottom-4 bg-black/95 border px-1.5 py-0.5 rounded text-[7px] font-mono whitespace-nowrap font-bold shadow-md" style="color: ${color}; border-color: ${color};">
            ${badgeLabel}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
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

  // Selected or active emergency tourist position with regional validation
  const selectedT = tourists_list?.find(t => t.ugid === selectedUgid) || tourist;
  const isEmergencyActive = active_incident !== null && active_incident !== undefined;
  const rawFocusLat = isEmergencyActive ? (active_incident.target_lat || active_incident.lkp_lat) : (selectedT?.current_lat || 11.3831);
  const rawFocusLon = isEmergencyActive ? (active_incident.target_lon || active_incident.lkp_lon) : (selectedT?.current_lon || 78.1626);
  const focusLat = (rawFocusLat <= 30 && rawFocusLon >= 0) ? rawFocusLat : 11.3831;
  const focusLon = (rawFocusLat <= 30 && rawFocusLon >= 0) ? rawFocusLon : 78.1626;
  const focusPos = [focusLat, focusLon];

  // Geofence Polygons dynamically calibrated to current tourist anchor
  const safeCoords = geofence_safe || [
    [focusLat + 0.0080, focusLon - 0.0120],
    [focusLat + 0.0095, focusLon + 0.0090],
    [focusLat - 0.0075, focusLon + 0.0105],
    [focusLat - 0.0090, focusLon - 0.0110]
  ];

  const hazardCoords = geofence_hazard || [
    [focusLat - 0.0010, focusLon - 0.0035],
    [focusLat + 0.0015, focusLon + 0.0015],
    [focusLat - 0.0030, focusLon + 0.0025],
    [focusLat - 0.0045, focusLon - 0.0020]
  ];

  // Dynamic Base Pad 01 and UAV Coordinates
  const padLat = landmarks?.uav_hangar?.lat || uav.base_lat || 11.3866;
  const padLon = landmarks?.uav_hangar?.lon || uav.base_lon || 78.1651;

  // When target locked, snap UAV position directly onto the red TARGET LKP marker
  const isTargetLocked = uav.target_locked || uav.status === 'TARGET_LOCKED';
  const rawUavLat = isTargetLocked ? focusLat : (uav.current_lat || uav.telemetry?.current_lat || padLat);
  const rawUavLon = isTargetLocked ? focusLon : (uav.current_lon || uav.telemetry?.current_lng || padLon);
  const uavLat = (rawUavLat <= 30 && rawUavLon >= 0) ? rawUavLat : padLat;
  const uavLon = (rawUavLon <= 30 && rawUavLon >= 0) ? rawUavLon : padLon;

  // Bounded UAV flight vector
  const uavVector = uav.status !== 'STANDBY' ? [
    [padLat, padLon],
    [uavLat, uavLon],
    [focusLat, focusLon]
  ] : null;

  // Ground Rescue Pursuit Approach Route (Outpost -> Echo-4 -> Victim LKP)
  const rescueOutpostLat = landmarks?.rescue_station?.lat || rescue_team.base_lat || 11.3785;
  const rescueOutpostLon = landmarks?.rescue_station?.lon || rescue_team.base_lon || 78.1595;
  const rescueLat = rescue_team.current_lat || rescueOutpostLat;
  const rescueLon = rescue_team.current_lon || rescueOutpostLon;

  const rescueVector = rescue_team.status !== 'STANDBY' ? [
    [rescueOutpostLat, rescueOutpostLon],
    [rescueLat, rescueLon],
    [focusLat, focusLon]
  ] : null;

  // Filter trail to avoid stale mock coordinates (exclude lat > 30 or lng < 0)
  const cleanFlightTrail = (uav.flight_trail || []).filter(
    pt => pt && pt[0] <= 30 && pt[1] >= 0 && Math.abs(pt[0] - focusLat) < 0.02 && Math.abs(pt[1] - focusLon) < 0.02
  );

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
          TACTICAL RADAR GIS // SECTOR TACTICAL-ALPHA
        </span>
        <span className="text-tactical-muted hidden sm:inline">
          FOCUS: {selectedT?.ugid || 'GX-8921-ALPHA'} ({Math.abs(focusLat).toFixed(4)}°{focusLat >= 0 ? 'N' : 'S'}, {Math.abs(focusLon).toFixed(4)}°{focusLon >= 0 ? 'E' : 'W'})
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
          UAV VECTOR &amp; SEARCH RADIUS
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="w-2 h-0.5 bg-amber-400" />
          GROUND SAR (ECHO-4) APPROACH ROUTE
        </div>
      </div>

      <MapContainer
        center={[11.3831, 78.1626]}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[420px]"
        style={{ position: 'relative', zIndex: 1 }}
        zoomControl={!embedded}
      >
        <MapController 
          targetPos={focusPos} 
          isEmergency={isEmergencyActive} 
          uavPos={[uavLat, uavLon]}
          isUavFlying={uav.status !== 'STANDBY'}
        />

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

        {/* Monitored Tourists (Filtered to exclude the active emergency victim so duplicate markers are never rendered) */}
        {tourists_list
          ?.filter(t => t.current_lat <= 30 && t.current_lon >= 0 && (!isEmergencyActive || t.ugid !== active_incident?.ugid))
          .map(t => (
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
          <Marker position={[focusLat, focusLon]} icon={createLkpIcon()} />
        )}

        {/* Real-time UAV Flight Trail Breadcrumbs */}
        {cleanFlightTrail.length > 1 && (
          <Polyline
            positions={cleanFlightTrail}
            pathOptions={{ color: '#00f0ff', weight: 2.5, opacity: 0.85 }}
          />
        )}

        {/* UAV Marker */}
        <Marker 
          position={[uavLat, uavLon]} 
          icon={createUavIcon(uav)}
        >
          <Popup>
            <div className="font-mono text-xs p-1">
              <div className="font-bold text-cyan-400">{uav.callsign}</div>
              <div>Status: {uav.status}</div>
              <div>Altitude: {uav.altitude_agl}m | Battery: {uav.battery_pct}%</div>
              <div>Heading: {uav.heading_deg}° | Speed: {uav.airspeed_mps} m/s</div>
            </div>
          </Popup>
        </Marker>

        {/* Ground Rescue Tactical Unit (Echo-4) Marker */}
        <Marker 
          position={[rescueLat, rescueLon]} 
          icon={createRescueTeamIcon(rescue_team, focusPos)}
        >
          <Popup>
            <div className="font-mono text-xs p-1">
              <div className="font-bold text-amber-400">{rescue_team.team_callsign || 'TACTICAL SAR // ECHO-4'}</div>
              <div>Status: {rescue_team.status}</div>
              <div>Speed: {rescue_team.speed_kmh || ((rescue_team.speed_mps || 0) * 3.6).toFixed(1)} km/h</div>
              <div>ETA: {rescue_team.eta_formatted || rescue_team.eta_seconds + 's'}</div>
              <div>Distance: {rescue_team.distance_to_target_m || 0}m</div>
            </div>
          </Popup>
        </Marker>

        {/* Flight Trajectory Vector (UAV) */}
        {uavVector && (
          <Polyline
            positions={uavVector}
            pathOptions={{ color: '#00f0ff', weight: 2, dashArray: '6, 6', opacity: 0.8 }}
          />
        )}

        {/* Ground Rescue Pursuit Approach Route (Outpost -> Echo-4 -> Victim LKP) */}
        {rescueVector && (
          <Polyline
            positions={rescueVector}
            pathOptions={{ color: '#ffb700', weight: 2.5, dashArray: '4, 4', opacity: 0.95 }}
          />
        )}

        {/* Green Rescue Rendezvous Ring when Ground Team arrives on scene / secures victim */}
        {(rescue_team.status === 'ON_SCENE' || rescue_team.status === 'VICTIM_SECURED') && (
          <Circle
            center={[focusLat, focusLon]}
            radius={35}
            pathOptions={{
              color: '#00ff9d',
              fillColor: '#00ff9d',
              fillOpacity: 0.35,
              weight: 2.5,
              dashArray: '3, 3'
            }}
          />
        )}

        {/* ISRID Statistical Search Rings (25%, 50%, 75% Probability Envelopes) */}
        {active_incident && (
          <>
            {/* 75% Outer Envelope */}
            <Circle
              center={[focusLat, focusLon]}
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
              center={[focusLat, focusLon]}
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
              center={[focusLat, focusLon]}
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
      </MapContainer>
    </div>
  );
}
