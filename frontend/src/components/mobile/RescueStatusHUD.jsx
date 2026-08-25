import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldCheck, Truck, Navigation2, CheckCircle2, Clock } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function RescueStatusHUD() {
  const { active_incident, uav, rescue_team, tourist } = useSystem();

  if (!active_incident) {
    return (
      <div className="tactical-box p-3 rounded border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-mono font-bold text-emerald-400">STATUS: SECURE</div>
            <div className="text-[10px] font-mono text-slate-400">Continuous AI Guard active. No incidents.</div>
          </div>
        </div>
        <StatusBadge status="SECURE" size="xs" />
      </div>
    );
  }

  const isResolved = active_incident.status === 'RESOLVED';
  const isTargetLocked = active_incident.status === 'TARGET_LOCKED' || active_incident.status === 'RESCUE_EN_ROUTE' || active_incident.status === 'ON_SCENE';
  const isEnRoute = active_incident.status === 'RESCUE_EN_ROUTE';
  const isOnScene = active_incident.status === 'ON_SCENE';

  return (
    <div className="tactical-box tactical-box-alert p-3.5 rounded border border-rose-500/80 bg-tactical-darkest/95 flex flex-col gap-2.5 shadow-crimson-glow animate-pulse-glow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rose-500/40 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-display font-black tracking-wider text-rose-400">
            EMERGENCY ACTIVE // {active_incident.incident_number}
          </span>
        </div>
        <StatusBadge status={active_incident.status} size="xs" pulse />
      </div>

      {/* Rescue Pipeline Steps */}
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
        {/* Step 1: UAV Status */}
        <div className={`p-2 rounded border ${
          uav.status !== 'STANDBY' ? 'bg-tactical-card border-tactical-cyan text-tactical-cyan' : 'bg-slate-900 border-tactical-border text-slate-500'
        }`}>
          <DroneIcon className="w-4 h-4 mx-auto mb-1 text-tactical-cyan" />
          <div className="font-bold">UAV BEACON</div>
          <div className="text-[9px] text-slate-400">{uav.status}</div>
        </div>

        {/* Step 2: Thermal Lock */}
        <div className={`p-2 rounded border ${
          isTargetLocked ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-tactical-border text-slate-500'
        }`}>
          <Navigation2 className="w-4 h-4 mx-auto mb-1" />
          <div className="font-bold">FLIR LOCK</div>
          <div className="text-[9px] text-slate-400">{isTargetLocked ? `${uav.target_confidence}% CONF` : 'SCANNING'}</div>
        </div>

        {/* Step 3: Ground Unit */}
        <div className={`p-2 rounded border ${
          isEnRoute || isOnScene ? 'bg-tactical-card border-amber-500 text-amber-400' : 'bg-slate-900 border-tactical-border text-slate-500'
        }`}>
          <Truck className="w-4 h-4 mx-auto mb-1" />
          <div className="font-bold">GROUND ECHO-4</div>
          <div className="text-[9px] text-slate-400">{isOnScene ? 'ON SCENE' : isEnRoute ? `ETA: ${rescue_team.eta_seconds}s` : 'STANDBY'}</div>
        </div>
      </div>

      {/* Live Instructions Banner */}
      <div className="p-2 rounded bg-rose-950/40 border border-rose-500/40 text-[11px] font-mono text-rose-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          {isOnScene
            ? 'Ground team is on scene. Maintain position for medical triage.'
            : isEnRoute
            ? `Ground rescue en route. UAV hovering overhead. ETA: ${rescue_team.eta_seconds}s`
            : isTargetLocked
            ? 'UAV has acquired your thermal position. Ground dispatch authorized.'
            : 'UAV dispatched to Last Known Position (LKP). Stand by.'}
        </span>
      </div>
    </div>
  );
}
