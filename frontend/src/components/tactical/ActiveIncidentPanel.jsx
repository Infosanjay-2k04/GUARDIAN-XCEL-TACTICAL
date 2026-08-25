import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldAlert, CheckCircle2, Truck, Navigation, Clock, Radio, Key, Crosshair, MapPin, Send, Layers } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';
import MultiDeptEscalationPanel from './MultiDeptEscalationPanel';

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

  const [viewTab, setViewTab] = useState('multi_dept'); // 'overview' | 'multi_dept'

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2.5">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-rose-400">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            INCIDENT TRIAGE
          </span>
          <div className="flex items-center bg-tactical-card rounded p-0.5 border border-tactical-border text-[9px]">
            <button
              onClick={() => setViewTab('multi_dept')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                viewTab === 'multi_dept' ? 'bg-tactical-cyan text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              MULTI-DEPT (3)
            </button>
            <button
              onClick={() => setViewTab('overview')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                viewTab === 'overview' ? 'bg-tactical-cyan text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              OVERVIEW
            </button>
          </div>
        </div>

        {active_incident ? (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500 text-rose-300 font-bold animate-pulse">
            CRITICAL
          </span>
        ) : (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-bold">
            0 ACTIVE
          </span>
        )}
      </div>

      {viewTab === 'multi_dept' ? (
        <div className="flex-1 overflow-y-auto pr-1">
          <MultiDeptEscalationPanel />
        </div>
      ) : active_incident ? (
        <div className="space-y-2.5 flex-1 flex flex-col justify-between overflow-y-auto pr-1">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => dispatchUav(active_incident.id)}
                className="flex items-center justify-center gap-1.5 p-2 rounded bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold transition-all active:scale-95 shadow-cyan-glow"
              >
                <DroneIcon className="w-3.5 h-3.5" />
                SCRAMBLE UAV
              </button>

              <button
                onClick={() => dispatchRescue(active_incident.id)}
                className="flex items-center justify-center gap-1.5 p-2 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold transition-all active:scale-95 shadow-amber-glow"
              >
                <Truck className="w-3.5 h-3.5" />
                DISPATCH RESCUE
              </button>
            </div>

            <button
              onClick={() => resolveIncident(active_incident.id)}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              MARK INCIDENT RESOLVED
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-tactical-border/60 rounded bg-tactical-card/40 font-mono space-y-2">
          <ShieldAlert className="w-8 h-8 text-emerald-400" />
          <div className="text-xs font-bold text-slate-200">SECTOR ALPHA SECURE</div>
          <div className="text-[10px] text-tactical-muted">All registered hikers within safety geofence boundaries. Normal vitals.</div>
        </div>
      )}
    </div>
  );
}
