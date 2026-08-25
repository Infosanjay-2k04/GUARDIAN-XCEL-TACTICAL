import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Battery, Gauge, Compass, Wind, Satellite, ShieldAlert } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function DroneHUD() {
  const { uav } = useSystem();

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5">
        <div className="flex items-center gap-2">
          <DroneIcon className="w-4 h-4 text-tactical-cyan" />
          <span className="font-display font-black text-xs text-white tracking-wider">
            {uav.callsign}
          </span>
        </div>
        <StatusBadge status={uav.status} size="xs" pulse={uav.status !== 'STANDBY'} />
      </div>

      {/* Primary Flight Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {/* Altitude */}
        <div className="p-2 rounded bg-tactical-card border border-tactical-border">
          <div className="text-[9px] font-mono text-tactical-muted uppercase">ALTITUDE AGL</div>
          <div className="text-base font-display font-bold text-tactical-cyan">
            {uav.altitude_agl.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">M</span>
          </div>
        </div>

        {/* Airspeed */}
        <div className="p-2 rounded bg-tactical-card border border-tactical-border">
          <div className="text-[9px] font-mono text-tactical-muted uppercase">AIRSPEED</div>
          <div className="text-base font-display font-bold text-white">
            {uav.airspeed_mps.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">M/S</span>
          </div>
        </div>

        {/* Heading */}
        <div className="p-2 rounded bg-tactical-card border border-tactical-border">
          <div className="text-[9px] font-mono text-tactical-muted uppercase">HEADING</div>
          <div className="text-base font-display font-bold text-amber-400">
            {uav.heading_deg.toFixed(0)}°
          </div>
        </div>

        {/* Battery */}
        <div className="p-2 rounded bg-tactical-card border border-tactical-border">
          <div className="text-[9px] font-mono text-tactical-muted uppercase">BATTERY</div>
          <div className={`text-base font-display font-bold flex items-center justify-center gap-1 ${
            uav.battery_pct < 20 ? 'text-rose-500' : 'text-emerald-400'
          }`}>
            <Battery className="w-3.5 h-3.5 fill-current" />
            {uav.battery_pct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Secondary Avionics Metrics */}
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-300">
        <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border flex items-center justify-between">
          <span className="text-tactical-muted">GNSS/RTK:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Satellite className="w-3 h-3" /> FIX (18 SATS)
          </span>
        </div>

        <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border flex items-center justify-between">
          <span className="text-tactical-muted">FLIGHT MODE:</span>
          <span className="text-tactical-cyan font-bold">{uav.search_pattern}</span>
        </div>

        <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border flex items-center justify-between">
          <span className="text-tactical-muted">AI DETECTION:</span>
          <span className={uav.target_locked ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}>
            {uav.target_locked ? `${uav.target_confidence}% LOCK` : 'SEARCHING'}
          </span>
        </div>
      </div>
    </div>
  );
}
