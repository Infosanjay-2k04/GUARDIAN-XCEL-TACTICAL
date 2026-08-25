import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldAlert, CheckCircle2, Truck, Navigation, Clock, Radio, Key, Crosshair, MapPin } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function ActiveIncidentPanel() {
  const { 
    active_incident, 
    tourist, 
    uav, 
    rescue_team, 
    comms, 
    dispatchUav, 
    dispatchRescue, 
    resolveIncident 
  } = useSystem();

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <span className="flex items-center gap-1.5 text-rose-400">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          ACTIVE INCIDENT
        </span>
        {active_incident ? (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500 text-rose-300 font-bold animate-pulse">
            CRITICAL EVENT
          </span>
        ) : (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-bold">
            0 ACTIVE
          </span>
        )}
      </div>

      {active_incident ? (
        <div className="space-y-2.5 flex-1 flex flex-col justify-between overflow-y-auto">
          {/* Incident Overview Card */}
          <div className="p-2.5 rounded border border-rose-500/60 bg-rose-950/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                {active_incident.incident_number}
              </span>
              <StatusBadge status={active_incident.status} size="xs" pulse />
            </div>

            <div className="text-[10px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-tactical-muted">Target UGID:</span>
                <span className="font-bold text-tactical-cyan">{active_incident.ugid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Threat Level:</span>
                <span className="font-bold text-rose-400">CRITICAL // RED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Incident Type:</span>
                <span className="text-amber-400 font-bold">{active_incident.trigger_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Detection Time:</span>
                <span className="text-slate-200">{active_incident.created_at || '09:52:03'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Last Known Pos (LKP):</span>
                <span className="text-slate-200 font-bold">
                  {active_incident.lkp_lat.toFixed(4)}°N, {Math.abs(active_incident.lkp_lon).toFixed(4)}°W
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Comms Channel:</span>
                <span className="text-tactical-cyan font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  {comms.channel === 'LORA_MESH' ? 'LORA 868MHz (FAILOVER)' : '4G LTE (PRIMARY)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Assigned UAV:</span>
                <span className="text-tactical-cyan font-bold">{active_incident.assigned_uav || 'UAV-ALPHA // PHOENIX-1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Assigned Rescue:</span>
                <span className="text-amber-400 font-bold">{active_incident.assigned_team || 'GROUND ECHO-4'}</span>
              </div>
              {active_incident.target_lat && (
                <div className="flex justify-between border-t border-rose-500/30 pt-1 text-emerald-400 font-bold">
                  <span>FLIR Verified Lock:</span>
                  <span>{active_incident.target_lat.toFixed(4)}°N, {Math.abs(active_incident.target_lon).toFixed(4)}°W</span>
                </div>
              )}
            </div>
          </div>

          {/* Tactical Action Buttons */}
          <div className="space-y-1.5 border-t border-tactical-border/60 pt-2">
            <div className="text-[9px] font-mono text-tactical-muted font-bold uppercase">
              TACTICAL OVERRIDE DISPATCH
            </div>

            <button
              onClick={() => dispatchUav(active_incident.id)}
              disabled={uav.status !== 'STANDBY'}
              className={`w-full flex items-center justify-center gap-2 p-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                uav.status === 'STANDBY'
                  ? 'bg-tactical-card hover:bg-tactical-cardHover border border-tactical-cyan text-tactical-cyan shadow-cyan-glow'
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <DroneIcon className="w-4 h-4 text-tactical-cyan" />
              {uav.status === 'STANDBY' ? 'SCRAMBLE UAV-ALPHA TO LKP' : `UAV STATUS: ${uav.status}`}
            </button>

            <button
              onClick={() => dispatchRescue(active_incident.id)}
              disabled={!active_incident.target_lat || rescue_team.status !== 'STANDBY'}
              className={`w-full flex items-center justify-center gap-2 p-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                active_incident.target_lat && rescue_team.status === 'STANDBY'
                  ? 'bg-amber-950/60 hover:bg-amber-900 border border-amber-500 text-amber-400 shadow-amber-glow'
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Truck className="w-4 h-4" />
              {rescue_team.status === 'STANDBY'
                ? active_incident.target_lat ? 'DISPATCH GROUND RESCUE (ECHO-4)' : 'AWAITING FLIR TARGET LOCK'
                : `GROUND RESCUE: ${rescue_team.status}`}
            </button>

            <button
              onClick={() => resolveIncident(active_incident.id)}
              className="w-full flex items-center justify-center gap-2 p-2 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              MARK INCIDENT RESOLVED
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40" />
          <div className="font-mono text-xs text-slate-300 font-bold">ALL SECTORS NOMINAL</div>
          <div className="font-mono text-[10px] text-slate-500 max-w-[200px]">
            No active distress beacons. Automated anomaly watchers scanning 4 registered tourist streams.
          </div>
        </div>
      )}
    </div>
  );
}
