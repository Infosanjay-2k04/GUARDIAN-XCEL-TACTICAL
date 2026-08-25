import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Crosshair, Play, Eye, RotateCcw, ShieldCheck, CheckCircle2, Navigation2, ArrowRight, Gauge, Radio, RefreshCw, Zap } from 'lucide-react';
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
    lockTarget,
    returnUavToBase,
    resetUav 
  } = useSystem();

  // Compute live Euclidean distance to LKP (m)
  const lkpLat = active_incident?.target_lat || active_incident?.lkp_lat || tourist?.current_lat || 37.7420;
  const lkpLon = active_incident?.target_lon || active_incident?.lkp_lon || tourist?.current_lon || -119.5975;
  const dLat = (lkpLat - (uav.current_lat || 37.7490)) * 111111.0;
  const dLon = (lkpLon - (uav.current_lon || -119.5860)) * 111111.0 * Math.cos(lkpLat * Math.PI / 180.0);
  const distMeters = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));

  const isFlying = uav.status !== 'STANDBY';
  const isSearching = uav.status === 'SEARCHING';
  const isLocked = uav.target_locked;

  const mavlink = uav.mavlink || {
    SYS_STATUS: { voltage_battery: 24.6, current_battery: 16.4, battery_remaining: Math.round(uav.battery_pct) },
    ATTITUDE: { roll_deg: uav.roll_deg || 0, pitch_deg: uav.pitch_deg || 0, yaw_deg: uav.heading_deg || 0 },
    MISSION_CURRENT: { throttle_pct: uav.throttle_pct || 0, seq: 1 }
  };

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2.5 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-bold text-slate-200">
        <span className="flex items-center gap-1.5 text-tactical-cyan">
          <Crosshair className="w-4 h-4 text-tactical-cyan" />
          AUTONOMOUS MISSION CONTROL &amp; MAVLINK TELEMETRY
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={resetUav}
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-all"
            title="Reset UAV to Pad 01"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            RESET
          </button>
          <StatusBadge status={uav.status} size="xs" pulse={isFlying} />
        </div>
      </div>

      {/* Primary Mission Readouts */}
      <div className="p-2.5 rounded bg-tactical-card/90 border border-tactical-border/80 text-[10px] space-y-1.5">
        <div className="flex justify-between">
          <span className="text-tactical-muted">Mission Protocol:</span>
          <span className="font-bold text-tactical-cyan">
            {active_incident ? 'SAR_DISTRESS_EXPANDING_SQUARE' : 'AUTONOMOUS_PATROL'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Target UGID &amp; LKP:</span>
          <span className="font-bold text-white">
            {active_incident?.ugid || tourist?.ugid || 'GX-8921-ALPHA'} ({Math.abs(lkpLat).toFixed(4)}°{lkpLat >= 0 ? 'N' : 'S'}, {Math.abs(lkpLon).toFixed(4)}°{lkpLon >= 0 ? 'E' : 'W'})
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-tactical-muted">Distance to Victim:</span>
          <span className={`font-bold ${distMeters < 25 ? 'text-emerald-400 font-black' : 'text-amber-400'}`}>
            {distMeters} METERS
          </span>
        </div>

        {/* 6-DOF Kinematics Grid */}
        <div className="grid grid-cols-4 gap-1 pt-1 border-t border-tactical-border/50 text-[9px] text-center">
          <div className="bg-tactical-darkest/80 p-1 rounded border border-tactical-border/60">
            <div className="text-tactical-muted">SPEED</div>
            <div className="font-bold text-cyan-300">{uav.airspeed_mps} m/s</div>
          </div>
          <div className="bg-tactical-darkest/80 p-1 rounded border border-tactical-border/60">
            <div className="text-tactical-muted">ALTITUDE</div>
            <div className="font-bold text-white">{uav.altitude_agl}m AGL</div>
          </div>
          <div className="bg-tactical-darkest/80 p-1 rounded border border-tactical-border/60">
            <div className="text-tactical-muted">THROTTLE</div>
            <div className="font-bold text-amber-300">{uav.throttle_pct || mavlink.MISSION_CURRENT.throttle_pct}%</div>
          </div>
          <div className="bg-tactical-darkest/80 p-1 rounded border border-tactical-border/60">
            <div className="text-tactical-muted">HEADING</div>
            <div className="font-bold text-emerald-300">{uav.heading_deg}°</div>
          </div>
        </div>

        {/* MAVLink ATTITUDE & POWER Readout */}
        <div className="flex justify-between text-[9px] text-slate-300 pt-1">
          <span>PITCH: <strong className="text-white">{uav.pitch_deg || mavlink.ATTITUDE.pitch_deg}°</strong> | ROLL: <strong className="text-white">{uav.roll_deg || mavlink.ATTITUDE.roll_deg}°</strong></span>
          <span>MAVLink: <strong className="text-emerald-400">{mavlink.SYS_STATUS.voltage_battery}V / {mavlink.SYS_STATUS.current_battery}A</strong></span>
        </div>

        {/* Search Progress Bar */}
        <div className="space-y-1 pt-1 border-t border-tactical-border/50">
          <div className="flex justify-between text-[9px]">
            <span className="text-tactical-muted">Expanding Square Scan:</span>
            <span className="text-tactical-cyan font-bold">{uav.search_progress_pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded bg-tactical-darkest border border-tactical-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-tactical-cyan to-emerald-400 transition-all duration-300 shadow-cyan-glow"
              style={{ width: `${uav.search_progress_pct}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between pt-0.5">
          <span className="text-tactical-muted">AI Detection:</span>
          <span className={`font-bold ${isLocked ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
            {isLocked ? `TARGET ACQUIRED (${uav.target_confidence || 97.6}%)` : isSearching ? 'SWEEPING SECTOR...' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Interactive Command Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto text-xs">
        <button
          onClick={() => dispatchUav(active_incident?.id)}
          className="flex items-center justify-center gap-1.5 p-2 rounded border bg-tactical-cyan/20 hover:bg-tactical-cyan/30 border-tactical-cyan text-white shadow-cyan-glow font-bold transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 text-tactical-cyan" />
          DISPATCH UAV TO LKP
        </button>

        <button
          onClick={startUavSearch}
          className="flex items-center justify-center gap-1.5 p-2 rounded border bg-amber-500/20 hover:bg-amber-500/30 border-amber-500 text-amber-200 font-bold transition-all active:scale-95"
        >
          <Navigation2 className="w-3.5 h-3.5 text-amber-400" />
          START SEARCH
        </button>

        <button
          onClick={triggerThermalScan}
          className="flex items-center justify-center gap-1.5 p-2 rounded border bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500 text-emerald-300 font-bold transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          THERMAL TARGET LOCK
        </button>

        <button
          onClick={returnUavToBase}
          className="flex items-center justify-center gap-1.5 p-2 rounded border border-tactical-border bg-tactical-card hover:bg-tactical-cardHover text-slate-300 hover:text-white font-bold transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          RETURN TO BASE (RTL)
        </button>
      </div>
    </div>
  );
}
