import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { AlertCircle, Truck, CheckCircle2, ShieldAlert, User, Navigation } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function IncidentQueue() {
  const { active_incident, tourist, uav, rescue_team, dispatchUav, dispatchRescue, resolveIncident } = useSystem();

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          ACTIVE INCIDENT TRIAGE
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tactical-card border border-tactical-border text-tactical-cyan">
          {active_incident ? '1 CRITICAL' : '0 PENDING'}
        </span>
      </div>

      {/* Incident Details Card */}
      {active_incident ? (
        <div className="space-y-3 flex-1 overflow-y-auto">
          <div className="p-2.5 rounded border border-rose-500/60 bg-rose-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-400">
                {active_incident.incident_number}
              </span>
              <StatusBadge status={active_incident.status} size="xs" pulse />
            </div>

            <div className="text-[10px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-tactical-muted">UGID Target:</span>
                <span className="font-bold text-tactical-cyan">{active_incident.ugid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Hiker Name:</span>
                <span className="font-bold text-slate-200">{tourist.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Trigger Reason:</span>
                <span className="text-amber-400 font-bold">{active_incident.trigger_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tactical-muted">Last Known Pos (LKP):</span>
                <span className="text-slate-200">{active_incident.lkp_lat.toFixed(4)}°N, {Math.abs(active_incident.lkp_lon).toFixed(4)}°W</span>
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
          <div className="space-y-2 border-t border-tactical-border/60 pt-2">
            <div className="text-[10px] font-mono text-tactical-muted font-bold uppercase">
              COMMAND OVERRIDE ACTIONS
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
          <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
          <div className="font-mono text-xs text-slate-400 font-bold">ALL SECTORS NOMINAL</div>
          <div className="font-mono text-[10px] text-slate-600">No active distress beacons. Automated anomaly watchers active.</div>
        </div>
      )}
    </div>
  );
}
