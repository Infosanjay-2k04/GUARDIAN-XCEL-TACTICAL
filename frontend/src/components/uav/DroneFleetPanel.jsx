import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Battery, Satellite, Signal, Radio, Navigation, Compass, Layers } from 'lucide-react';
import DroneIcon from '../common/DroneIcon';
import StatusBadge from '../common/StatusBadge';

export default function DroneFleetPanel() {
  const { uav_fleet, uav, selectedDroneId, setSelectedDroneId } = useSystem();

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <span className="flex items-center gap-1.5 text-tactical-cyan">
          <DroneIcon className="w-4 h-4 text-tactical-cyan" />
          DRONE FLEET TELEMETRY
        </span>
        <span className="text-[10px] text-tactical-muted font-normal">
          {uav_fleet?.length || 3} SQUADRON UNITS
        </span>
      </div>

      {/* Fleet List */}
      <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
        {uav_fleet?.map((drone) => {
          const isSelected = drone.drone_id === selectedDroneId;
          const isActiveDrone = drone.drone_id === 'DRONE-01';
          const isFlying = drone.status !== 'STANDBY';
          const isLocked = drone.target_locked;

          return (
            <div
              key={drone.drone_id}
              onClick={() => setSelectedDroneId(drone.drone_id)}
              className={`p-2.5 rounded border text-[10px] font-mono transition-all cursor-pointer space-y-2 ${
                isSelected
                  ? 'bg-tactical-card/90 border-tactical-cyan shadow-cyan-glow'
                  : 'bg-tactical-card/50 hover:bg-tactical-card/70 border-tactical-border'
              } ${isFlying ? 'border-cyan-400/80' : ''}`}
            >
              {/* Drone ID and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DroneIcon className={`w-4 h-4 ${isFlying ? 'text-tactical-cyan animate-pulse' : 'text-slate-400'}`} />
                  <span className="font-bold text-white tracking-wide text-xs">{drone.drone_id}</span>
                  <span className="text-[9px] text-tactical-muted hidden sm:inline">{drone.callsign.split('//')[0]}</span>
                </div>
                <StatusBadge status={drone.status} size="xs" pulse={isFlying} />
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="p-1 rounded bg-tactical-darkest border border-tactical-border/60">
                  <div className="text-[8px] text-tactical-muted uppercase">BATTERY</div>
                  <div className={`font-bold flex items-center justify-center gap-1 ${
                    drone.battery_pct < 20 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    <Battery className="w-3 h-3 fill-current" />
                    {drone.battery_pct.toFixed(0)}%
                  </div>
                </div>

                <div className="p-1 rounded bg-tactical-darkest border border-tactical-border/60">
                  <div className="text-[8px] text-tactical-muted uppercase">ALTITUDE</div>
                  <div className="font-bold text-tactical-cyan">
                    {drone.altitude_agl.toFixed(1)}m
                  </div>
                </div>

                <div className="p-1 rounded bg-tactical-darkest border border-tactical-border/60">
                  <div className="text-[8px] text-tactical-muted uppercase">SIGNAL</div>
                  <div className="font-bold text-slate-200 flex items-center justify-center gap-0.5">
                    <Signal className="w-3 h-3 text-tactical-cyan" />
                    {drone.signal_rssi_dbm} dBm
                  </div>
                </div>
              </div>

              {/* Coordinates and Mission Details */}
              <div className="space-y-0.5 text-slate-300 text-[9px] border-t border-tactical-border/40 pt-1">
                <div className="flex justify-between">
                  <span className="text-tactical-muted">GPS Fix:</span>
                  <span className="font-bold text-slate-200">
                    {drone.current_lat.toFixed(4)}°N, {Math.abs(drone.current_lon).toFixed(4)}°W
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tactical-muted">Role:</span>
                  <span className="text-slate-300 font-semibold">{drone.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tactical-muted">Mission:</span>
                  <span className="text-amber-400 font-bold truncate max-w-[170px]">{drone.mission}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
