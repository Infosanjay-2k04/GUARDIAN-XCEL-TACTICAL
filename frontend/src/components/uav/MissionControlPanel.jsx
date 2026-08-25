import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Crosshair, Play, Eye, RotateCcw, ShieldCheck, CheckCircle2, Navigation2, ArrowRight } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function MissionControlPanel() {
  const { 
    uav, 
    active_incident, 
    tourist, 
    dispatchUav, 
    startUavSearch, 
    triggerThermalScan, 
    returnUavToBase 
  } = useSystem();

  // Compute live Euclidean distance to LKP (m)
  const lkpLat = active_incident?.lkp_lat || tourist.current_lat;
  const lkpLon = active_incident?.lkp_lon || tourist.current_lon;
  const dLat = lkpLat - uav.current_lat;
  const dLon = lkpLon - uav.current_lon;
  const distMeters = Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 111000);

  const isFlying = uav.status !== 'STANDBY';
  const isSearching = uav.status === 'SEARCHING';
  const isLocked = uav.target_locked;

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <span className="flex items-center gap-1.5 text-tactical-cyan">
          <Crosshair className="w-4 h-4 text-tactical-cyan" />
          MISSION CONTROL & OVERRIDES
        </span>
        <StatusBadge status={uav.status} size="xs" pulse={isFlying} />
      </div>

      {/* Mission Telemetry Readouts */}
      <div className="p-2.5 rounded bg-tactical-card/90 border border-tactical-border/80 text-[10px] font-mono space-y-1.5">
        <div className="flex justify-between">
          <span className="text-tactical-muted">Current Mission:</span>
          <span className="font-bold text-tactical-cyan">
            {active_incident ? 'SAR_DISTRESS_LOCATE' : 'AUTONOMOUS_PATROL'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Target UGID:</span>
          <span className="font-bold text-white">
            {active_incident?.ugid || tourist.ugid}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Target LKP:</span>
          <span className="text-slate-200 font-semibold">
            {lkpLat.toFixed(4)}°N, {Math.abs(lkpLon).toFixed(4)}°W
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Distance to Target:</span>
          <span className={`font-bold ${distMeters < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {distMeters} METERS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Search Pattern:</span>
          <span className="text-tactical-cyan font-bold">{uav.search_pattern}</span>
        </div>

        {/* Search Progress Bar */}
        <div className="space-y-1 pt-1 border-t border-tactical-border/50">
          <div className="flex justify-between text-[9px]">
            <span className="text-tactical-muted">Sector Scan Progress:</span>
            <span className="text-tactical-cyan font-bold">{uav.search_progress_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded bg-tactical-darkest border border-tactical-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-tactical-cyan to-emerald-400 transition-all duration-300 shadow-cyan-glow"
              style={{ width: `${uav.search_progress_pct}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between pt-1">
          <span className="text-tactical-muted">Thermal Sensor:</span>
          <span className="text-emerald-400 font-bold">FLIR 30 FPS (ACTIVE)</span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Detection Confidence:</span>
          <span className={`font-bold ${isLocked ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
            {isLocked ? `${uav.target_confidence}% (LOCKED)` : isSearching ? 'EVALUATING...' : 'IDLE'}
          </span>
        </div>

        <div className="flex justify-between border-t border-tactical-border/50 pt-1">
          <span className="text-tactical-muted">Rescue Handoff:</span>
          <span className={isLocked ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {isLocked ? 'TRANSMITTED TO ECHO-4' : 'PENDING TARGET LOCK'}
          </span>
        </div>
      </div>

      {/* Real Interactive UAV Controls */}
      <div className="space-y-1.5 border-t border-tactical-border/60 pt-2 mt-auto">
        <div className="text-[9px] font-mono text-tactical-muted font-bold uppercase">
          MISSION COMMAND DISPATCH
        </div>

        <button
          onClick={() => dispatchUav(active_incident?.id)}
          disabled={uav.status !== 'STANDBY'}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            uav.status === 'STANDBY'
              ? 'bg-tactical-card hover:bg-tactical-cardHover border border-tactical-cyan text-tactical-cyan shadow-cyan-glow'
              : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <DroneIcon className="w-4 h-4 text-tactical-cyan" />
          DISPATCH UAV TO LKP
        </button>

        <button
          onClick={startUavSearch}
          disabled={uav.status === 'STANDBY' || uav.status === 'SEARCHING' || isLocked}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            uav.status === 'EN_ROUTE_LKP'
              ? 'bg-amber-950/60 hover:bg-amber-900 border border-amber-500 text-amber-400 shadow-amber-glow'
              : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          START SEARCH PATTERN
        </button>

        <button
          onClick={triggerThermalScan}
          disabled={isLocked || uav.status === 'STANDBY'}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            !isLocked && uav.status !== 'STANDBY'
              ? 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500 text-emerald-400 shadow-emerald-glow'
              : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Eye className="w-4 h-4" />
          THERMAL SCAN / TARGET LOCK
        </button>

        <button
          onClick={returnUavToBase}
          disabled={uav.status === 'STANDBY' || uav.status === 'RETURNING'}
          className="w-full flex items-center justify-center gap-2 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          RETURN TO BASE (RTL)
        </button>
      </div>
    </div>
  );
}
