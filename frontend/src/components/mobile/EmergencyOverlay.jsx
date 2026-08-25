import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Flame, Siren, MapPin, Radio, Clock, Wifi, CheckCircle2, Truck } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

/**
 * Full-screen emergency overlay for mobile.
 * Renders when active_incident is set. Shows all rescue pipeline stages
 * and remains synchronized with the Tactical Command Center via WebSocket.
 */
export default function EmergencyOverlay() {
  const { tourist, active_incident, uav, rescue_team, comms, isConnected } = useSystem();

  if (!active_incident) return null;

  const status = active_incident.status;
  const isResolved = status === 'RESOLVED';
  const isOnScene = status === 'ON_SCENE';
  const isRescueEnRoute = status === 'RESCUE_EN_ROUTE' || isOnScene;
  const isTargetLocked = status === 'TARGET_LOCKED' || isRescueEnRoute;
  const isSearching = status === 'SEARCHING' || isTargetLocked;
  const isUavDispatched = uav.status !== 'STANDBY';
  const isLoRa = comms.channel === 'LORA_MESH';

  // Main status headline
  const getHeadline = () => {
    if (isResolved) return { text: 'RESCUE COMPLETED', color: 'text-emerald-400', glow: 'shadow-emerald-glow', border: 'border-emerald-500' };
    if (isOnScene) return { text: 'RESCUE TEAM ON SCENE', color: 'text-emerald-400', glow: 'shadow-emerald-glow', border: 'border-emerald-500' };
    if (isRescueEnRoute) return { text: 'RESCUE TEAM EN ROUTE', color: 'text-amber-400', glow: 'shadow-amber-glow', border: 'border-amber-500' };
    if (isTargetLocked) return { text: 'VICTIM LOCATED', color: 'text-emerald-400', glow: 'shadow-emerald-glow', border: 'border-emerald-500' };
    if (isSearching) return { text: 'SEARCH IN PROGRESS', color: 'text-tactical-cyan', glow: 'shadow-cyan-glow', border: 'border-tactical-cyan' };
    if (isUavDispatched) return { text: 'UAV DISPATCHED', color: 'text-tactical-cyan', glow: 'shadow-cyan-glow', border: 'border-tactical-cyan' };
    return { text: 'EMERGENCY DETECTED', color: 'text-rose-400', glow: 'shadow-crimson-glow', border: 'border-rose-500' };
  };

  const headline = getHeadline();

  return (
    <div className="flex flex-col gap-3 pb-2">

      {/* ===== HEADLINE EMERGENCY BANNER ===== */}
      <div className={`p-3.5 rounded border ${headline.border} bg-tactical-darkest relative overflow-hidden ${headline.glow}`}>
        {/* Animated scan line decoration */}
        {!isResolved && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 animate-pulse opacity-10"
              style={{ background: 'linear-gradient(transparent 40%, rgba(255,34,85,0.4) 50%, transparent 60%)' }} />
          </div>
        )}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {isResolved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Flame className={`w-5 h-5 ${headline.color} animate-bounce`} />
            )}
            <div>
              <div className={`text-sm font-display font-black tracking-widest ${headline.color}`}>
                {headline.text}
              </div>
              <div className="text-[9px] font-mono text-tactical-muted">
                INCIDENT {active_incident.incident_number}
              </div>
            </div>
          </div>
          <StatusBadge status={status} size="xs" pulse={!isResolved} />
        </div>
      </div>

      {/* ===== INCIDENT DETAIL CARD ===== */}
      <div className="p-2.5 rounded border border-rose-500/50 bg-tactical-card/80 space-y-1.5 text-[10px] font-mono">
        <div className="text-[9px] font-bold text-rose-400 uppercase border-b border-rose-500/30 pb-1.5 flex items-center gap-1">
          <Siren className="w-3 h-3" />
          INCIDENT DETAILS
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-tactical-muted">Your UGID:</span>
            <span className="font-bold text-tactical-cyan">{active_incident.ugid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Current Coordinates:</span>
            <span className="font-bold text-white">
              {tourist.current_lat.toFixed(4)}°N, {Math.abs(tourist.current_lon).toFixed(4)}°W
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Last Known Position:</span>
            <span className="font-bold text-rose-300">
              {active_incident.lkp_lat.toFixed(4)}°N, {Math.abs(active_incident.lkp_lon).toFixed(4)}°W
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Threat Level:</span>
            <span className="font-bold text-rose-400">CRITICAL // RED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Detection Cause:</span>
            <span className="font-bold text-amber-300">{active_incident.trigger_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Detection Time:</span>
            <span className="text-slate-200">{active_incident.created_at || '--:--:--'}</span>
          </div>
        </div>
      </div>

      {/* ===== COMMS & TACTICAL STATUS ===== */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className={`p-2.5 rounded border space-y-0.5 ${isLoRa ? 'border-amber-500/60 bg-amber-950/30' : 'border-emerald-500/40 bg-emerald-950/20'}`}>
          <div className="text-[8px] text-tactical-muted font-bold uppercase">COMMUNICATION</div>
          <div className={`flex items-center gap-1 font-bold ${isLoRa ? 'text-amber-400' : 'text-emerald-400'}`}>
            <Radio className="w-3 h-3" />
            {isLoRa ? 'LORA 868MHz' : '4G LTE UPLINK'}
          </div>
          <div className="text-[8px] text-tactical-muted">{isLoRa ? 'LoRa mesh failover active' : 'Cellular primary link'}</div>
        </div>

        <div className={`p-2.5 rounded border space-y-0.5 ${isConnected ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-rose-500/40 bg-rose-950/20'}`}>
          <div className="text-[8px] text-tactical-muted font-bold uppercase">TACTICAL HUB</div>
          <div className={`flex items-center gap-1 font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            <Wifi className="w-3 h-3" />
            {isConnected ? 'CONNECTED' : 'OFFLINE'}
          </div>
          <div className="text-[8px] text-tactical-muted">Command center WebSocket</div>
        </div>
      </div>

      {/* ===== MULTI-DEPARTMENT AUTONOMOUS ESCALATIONS ===== */}
      <div className="space-y-1.5 p-2.5 rounded bg-tactical-dark border border-tactical-border/80 font-mono">
        <div className="text-[9px] font-bold text-slate-300 uppercase flex items-center justify-between">
          <span>DEPARTMENTAL DISPATCHES:</span>
          <span className="text-emerald-400 text-[8px]">AES-256 SECURED</span>
        </div>
        <div className="p-1.5 rounded bg-blue-950/40 border border-blue-500/50 text-[9px] flex justify-between text-blue-200">
          <span className="font-bold">Police Intercept:</span>
          <span>DISPATCHED // EN ROUTE</span>
        </div>
        <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/50 text-[9px] flex justify-between text-rose-200">
          <span className="font-bold">Medical Fast-Track:</span>
          <span>Blood Transmitted ({tourist.blood_type || 'O-POS'})</span>
        </div>
        <div className="p-1.5 rounded bg-amber-950/40 border border-amber-500/50 text-[9px] flex justify-between text-amber-200">
          <span className="font-bold">Ground SAR (Echo-4):</span>
          <span className="font-bold">{isOnScene ? 'ON SCENE' : `ETA: ${(rescue_team.eta_minutes || 3.0).toFixed(1)} MINS`}</span>
        </div>
      </div>

      {/* ===== RESCUE PIPELINE ===== */}
      <div className="space-y-2">
        <div className="text-[9px] font-mono font-bold text-tactical-muted uppercase">
          RESCUE PIPELINE STATUS
        </div>

        {/* Pipeline steps */}
        {[
          {
            icon: <Flame className="w-4 h-4" />,
            label: 'EMERGENCY DETECTED',
            sublabel: active_incident.trigger_type,
            done: true,
            color: 'rose'
          },
          {
            icon: <DroneIcon className="w-4 h-4" />,
            label: isUavDispatched ? 'UAV DISPATCHED' : 'UAV — PENDING DISPATCH',
            sublabel: isUavDispatched ? `${uav.callsign?.split('//')[0].trim()} — ${uav.status}` : 'Awaiting command center dispatch',
            done: isUavDispatched,
            color: 'cyan'
          },
          {
            icon: <MapPin className="w-4 h-4" />,
            label: isSearching ? 'SEARCH IN PROGRESS' : 'SEARCH — PENDING',
            sublabel: isSearching ? `Pattern: ${uav.search_pattern} — ${uav.search_progress_pct}% complete` : 'Awaiting LKP arrival',
            done: isSearching,
            color: 'cyan'
          },
          {
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: isTargetLocked ? 'VICTIM LOCATED' : 'THERMAL LOCK — PENDING',
            sublabel: isTargetLocked ? `FLIR confidence: ${uav.target_confidence || 97.6}%` : 'Awaiting FLIR thermal scan',
            done: isTargetLocked,
            color: 'emerald'
          },
          {
            icon: <Truck className="w-4 h-4" />,
            label: isRescueEnRoute ? (isOnScene ? 'RESCUE ON SCENE' : 'RESCUE EN ROUTE') : 'GROUND RESCUE — PENDING',
            sublabel: isOnScene ? 'Ground Echo-4 at location' :
                      isRescueEnRoute ? `ETA: ${rescue_team.eta_seconds}s` :
                      'Awaiting target lock for dispatch',
            done: isRescueEnRoute,
            color: 'amber'
          },
          {
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: isResolved ? 'RESCUE COMPLETED' : 'INCIDENT RESOLVED — PENDING',
            sublabel: isResolved ? 'Tourist secured. System restored.' : 'Awaiting medical clearance',
            done: isResolved,
            color: 'emerald'
          }
        ].map((step, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 p-2.5 rounded border transition-all ${
              step.done
                ? step.color === 'emerald' ? 'border-emerald-500/60 bg-emerald-950/25'
                : step.color === 'amber' ? 'border-amber-500/60 bg-amber-950/25'
                : step.color === 'rose' ? 'border-rose-500/60 bg-rose-950/25'
                : 'border-tactical-cyan/50 bg-tactical-darkest/80'
                : 'border-tactical-border/50 bg-tactical-darkest/40'
            }`}
          >
            <div className={`shrink-0 mt-0.5 ${
              step.done
                ? step.color === 'emerald' ? 'text-emerald-400'
                : step.color === 'amber' ? 'text-amber-400'
                : step.color === 'rose' ? 'text-rose-400'
                : 'text-tactical-cyan'
                : 'text-slate-600'
            }`}>
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-mono font-bold ${
                step.done
                  ? step.color === 'emerald' ? 'text-emerald-300'
                  : step.color === 'amber' ? 'text-amber-300'
                  : step.color === 'rose' ? 'text-rose-300'
                  : 'text-tactical-cyan'
                  : 'text-slate-500'
              }`}>
                {step.label}
              </div>
              <div className={`text-[9px] font-mono ${step.done ? 'text-slate-300' : 'text-slate-600'}`}>
                {step.sublabel}
              </div>
            </div>
            {step.done && (
              <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1 ${
                step.color === 'emerald' ? 'bg-emerald-400' :
                step.color === 'amber' ? 'bg-amber-400' :
                step.color === 'rose' ? 'bg-rose-400' : 'bg-tactical-cyan'
              } animate-pulse`} />
            )}
          </div>
        ))}
      </div>

      {/* Instructions footer */}
      <div className={`p-2.5 rounded border text-[10px] font-mono flex items-start gap-1.5 ${
        isResolved ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' :
        isOnScene ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' :
        isRescueEnRoute ? 'border-amber-500/30 bg-amber-950/20 text-amber-300' :
        'border-rose-500/30 bg-rose-950/20 text-rose-300'
      }`}>
        <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isResolved
            ? 'You have been successfully rescued. Guardian Xcel system is back to normal monitoring.'
            : isOnScene
            ? 'Ground rescue team Echo-4 is on scene. Please remain calm and wait for medical triage.'
            : isRescueEnRoute
            ? `Ground rescue team Echo-4 is en route. Estimated arrival: ${rescue_team.eta_seconds} seconds.`
            : isTargetLocked
            ? 'Rescue drone has acquired your position. Ground team is being dispatched. Stay visible.'
            : isSearching
            ? 'UAV is searching your last known position. Remain still and visible if possible.'
            : isUavDispatched
            ? 'Search and rescue drone has been launched. It is heading to your last known position.'
            : 'Emergency SOS signal transmitted. Tactical Command Center has been alerted. Help is coming.'}
        </span>
      </div>
    </div>
  );
}
