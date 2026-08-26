import React, { useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { MapContainer, TileLayer, Marker, Polygon, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Safe zone and hazard polygon coords
const SAFE_COORDS = [
  [11.4080, 78.1500],
  [11.4095, 78.1700],
  [11.3920, 78.1710],
  [11.3900, 78.1510]
];
const HAZARD_COORDS = [
  [11.3985, 78.1580],
  [11.4010, 78.1630],
  [11.3965, 78.1640],
  [11.3950, 78.1595]
];

function createSelfIcon(threatLevel) {
  const color = threatLevel === 'CRITICAL' ? '#ff2255' : threatLevel === 'WARNING' ? '#ffb700' : '#00f0ff';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
        <div style="position:absolute;width:28px;height:28px;border-radius:50%;border:2px solid ${color};animation:ping 1.2s ease-in-out infinite;opacity:0.55;"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 10px ${color};"></div>
        <div style="position:absolute;bottom:-14px;background:#040914;border:1px solid ${color};padding:1px 4px;border-radius:2px;font-family:monospace;font-size:8px;color:${color};white-space:nowrap;font-weight:bold;">YOU</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function ExploreMapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function ExploreScreen() {
  const { tourist, tourists_list, active_incident, uav, geofence_safe, geofence_hazard, landmarks } = useSystem();

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

  const inSafeZone = true; // In a real system, would do polygon point-in-polygon check
  const nearHazard = false;

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Section header */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-200 border-b border-tactical-border/60 pb-1.5">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-tactical-cyan" />
          TERRAIN & SAFETY MAP
        </span>
        <span className="text-tactical-muted">LIVE GPS RADAR</span>
      </div>

      {/* Map */}
      <div className="relative w-full rounded border border-tactical-border/80 overflow-hidden" style={{ height: '260px' }}>
        {/* Radar corner lines */}
        <div className="absolute top-1.5 left-1.5 w-4 h-4 border-l-2 border-t-2 border-tactical-cyan/60 z-10 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 border-r-2 border-t-2 border-tactical-cyan/60 z-10 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-l-2 border-b-2 border-tactical-cyan/60 z-10 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-r-2 border-b-2 border-tactical-cyan/60 z-10 pointer-events-none" />

        <MapContainer
          center={[tourist.current_lat, tourist.current_lon]}
          zoom={14}
          scrollWheelZoom={false}
          zoomControl={false}
          className="w-full h-full"
          attributionControl={false}
        >
          <ExploreMapController center={[tourist.current_lat, tourist.current_lon]} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxZoom={19} />

          {/* Safe zone */}
          <Polygon positions={safeCoords} pathOptions={{ color: '#00ff9d', fillColor: '#00ff9d', fillOpacity: 0.06, weight: 1.5, dashArray: '5,4' }} />

          {/* Hazard zone */}
          <Polygon positions={hazardCoords} pathOptions={{ color: '#ff2255', fillColor: '#ff2255', fillOpacity: 0.13, weight: 1.5 }} />

          {/* Self marker */}
          <Marker position={[tourist.current_lat, tourist.current_lon]} icon={createSelfIcon(tourist.threat_level)}>
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold text-cyan-400">YOU: {tourist.ugid}</div>
                <div>{tourist.current_lat.toFixed(4)}°N, {Math.abs(tourist.current_lon).toFixed(4)}°W</div>
              </div>
            </Popup>
          </Marker>

          {/* Ranger HQ */}
          {landmarks?.ranger_hq && (
            <Marker
              position={[landmarks.ranger_hq.lat, landmarks.ranger_hq.lon]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:#0d1d3a;border:1px solid #38bdf8;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:8px;color:#38bdf8;white-space:nowrap;font-weight:bold;">RANGER HQ</div>`,
                iconSize: [70, 18],
                iconAnchor: [35, 9]
              })}
            />
          )}

          {/* Nearby tourists */}
          {tourists_list?.filter(t => t.ugid !== tourist.ugid).map(t => (
            <Circle
              key={t.ugid}
              center={[t.current_lat, t.current_lon]}
              radius={8}
              pathOptions={{ color: '#5c769d', fillColor: '#5c769d', fillOpacity: 0.7, weight: 1 }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Area Status Cards */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className={`p-2.5 rounded border ${inSafeZone ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-rose-500/50 bg-rose-950/30'}`}>
          <div className="flex items-center gap-1 font-bold mb-0.5">
            <CheckCircle2 className={`w-3 h-3 ${inSafeZone ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className={inSafeZone ? 'text-emerald-400' : 'text-rose-400'}>GEOFENCE STATUS</span>
          </div>
          <div className="text-slate-300">{inSafeZone ? 'Inside Safe Zone' : 'OUTSIDE SAFE ZONE'}</div>
          <div className="text-tactical-muted text-[9px]">Monitored perimeter active</div>
        </div>

        <div className={`p-2.5 rounded border ${nearHazard ? 'border-amber-500/60 bg-amber-950/30' : 'border-tactical-border bg-tactical-card/50'}`}>
          <div className="flex items-center gap-1 font-bold mb-0.5">
            <AlertTriangle className={`w-3 h-3 ${nearHazard ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className={nearHazard ? 'text-amber-400' : 'text-tactical-muted'}>HAZARD PROXIMITY</span>
          </div>
          <div className="text-slate-300">{nearHazard ? 'CLIFF HAZARD NEAR' : 'Clear of hazards'}</div>
          <div className="text-tactical-muted text-[9px]">Cliff zones: 380m SE</div>
        </div>
      </div>

      {/* Nearby registered hikers */}
      <div className="p-2.5 rounded border border-tactical-border/80 bg-tactical-card/60 space-y-1.5">
        <div className="text-[9px] font-mono text-tactical-muted font-bold uppercase border-b border-tactical-border/50 pb-1">
          REGISTERED GUARDIAN XCEL HIKERS — NEARBY
        </div>
        {tourists_list?.filter(t => t.ugid !== tourist.ugid).map(t => (
          <div key={t.ugid} className="flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${t.threat_level === 'CRITICAL' ? 'bg-rose-500 animate-ping' : t.threat_level === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 font-bold">{t.ugid}</span>
              <span className="text-tactical-muted">— {t.full_name}</span>
            </div>
            <span className={`font-bold ${t.threat_level === 'CRITICAL' ? 'text-rose-400' : t.threat_level === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {t.threat_level}
            </span>
          </div>
        ))}
      </div>

      {/* Trail safety notice */}
      <div className="p-2 rounded border border-tactical-cyan/30 bg-tactical-card/40 text-[9px] font-mono text-tactical-muted flex items-start gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-tactical-cyan shrink-0 mt-0.5" />
        <span>
          Guardian Xcel AI guard is monitoring your biometrics and location continuously. 
          Stay within the green geofence for fastest response coverage.
        </span>
      </div>
    </div>
  );
}
