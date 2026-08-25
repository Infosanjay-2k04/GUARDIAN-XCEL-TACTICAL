import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldCheck, Truck, Navigation2, CheckCircle2, Clock, Shield, HeartPulse, Lock } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function RescueStatusHUD() {
  const { active_incident, uav, rescue_team, tourist, departmental_dispatches } = useSystem();

  if (!active_incident) {
    return (
      <div className="tactical-box p-3 rounded border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-emerald-400">STATUS: SECURE</div>
            <div className="text-[10px] text-slate-400">Continuous AI Guard active. No incidents.</div>
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

  const dispatches = departmental_dispatches || {};

  return (
    <div className="tactical-box tactical-box-alert p-3 rounded border border-rose-500/80 bg-tactical-darkest/98 flex flex-col gap-2.5 shadow-crimson-glow font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rose-500/40 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-black tracking-wider text-rose-400">
            EMERGENCY ACTIVE // {active_incident.incident_number}
          </span>
        </div>
        <StatusBadge status={active_incident.status} size="xs" pulse />
      </div>

      {/* Multi-Department Real-Time Alerts */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[9px] font-bold text-slate-300 flex items-center justify-between">
          <span>MULTI-DEPARTMENT AUTONOMOUS DISPATCH:</span>
          <span className="text-emerald-400 text-[8px] flex items-center gap-0.5">
            <Lock className="w-2.5 h-2.5" /> AES-256
          </span>
        </div>

        {/* 1. Police Alert */}
        <div className="p-1.5 rounded bg-blue-950/40 border border-blue-500/60 flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5 text-blue-300 font-bold">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Police Intercept:</span>
          </div>
          <span className="text-blue-200 font-semibold">
            {dispatches.police?.status_label || 'DISPATCHED // VECTOR ACTIVE'}
          </span>
        </div>

        {/* 2. Medical Fast-Track */}
        <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/60 flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5 text-rose-300 font-bold">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Medical Protocol:</span>
          </div>
          <span className="text-rose-200 font-semibold">
            Blood Vault Transmitted ({tourist.blood_type || 'O-POS'})
          </span>
        </div>

        {/* 3. Ground SAR Echo-4 */}
        <div className="p-1.5 rounded bg-amber-950/40 border border-amber-500/60 flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Ground SAR (Echo-4):</span>
          </div>
          <span className="text-amber-200 font-bold">
            {isOnScene ? 'ON SCENE' : `ETA: ${(rescue_team.eta_minutes || 3.0).toFixed(1)} MINS`}
          </span>
        </div>
      </div>

      {/* Drone & Thermal Pipeline Steps */}
      <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-1 border-t border-rose-500/30">
        <div className={`p-1.5 rounded border ${
          uav.status !== 'STANDBY' ? 'bg-tactical-card border-tactical-cyan text-tactical-cyan' : 'bg-slate-900 border-tactical-border text-slate-500'
        }`}>
          <DroneIcon className="w-3.5 h-3.5 mx-auto mb-0.5 text-tactical-cyan" />
          <div className="font-bold text-[9px]">UAV-ALPHA PHOENIX</div>
          <div className="text-[8px] text-slate-300">{uav.status}</div>
        </div>

        <div className={`p-1.5 rounded border ${
          isTargetLocked ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-tactical-border text-slate-500'
        }`}>
          <Navigation2 className="w-3.5 h-3.5 mx-auto mb-0.5" />
          <div className="font-bold text-[9px]">FLIR THERMAL LOCK</div>
          <div className="text-[8px] text-slate-300">{isTargetLocked ? `${uav.target_confidence || 97.6}% CONF` : 'SCANNING'}</div>
        </div>
      </div>

      {/* Live Instructions Banner */}
      <div className="p-2 rounded bg-rose-950/60 border border-rose-500/50 text-[10px] text-rose-200 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          {isOnScene
            ? 'Ground team is on scene. Maintain position for medical triage.'
            : isEnRoute
            ? `Ground rescue en route. UAV hovering overhead. ETA: ${(rescue_team.eta_minutes || 3.0).toFixed(1)}m`
            : isTargetLocked
            ? 'UAV has confirmed thermal target lock. Ground unit rolling.'
            : 'UAV dispatched to Last Known Position (LKP). Stand by.'}
        </span>
      </div>
    </div>
  );
}
