import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Shield, Radio, Wifi, WifiOff, Activity, CheckCircle2, AlertTriangle, Clock, Cpu } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SafetyScreen() {
  const { tourist, comms, active_incident, recent_events, isConnected } = useSystem();

  const isLoRa = comms.channel === 'LORA_MESH';
  const isCritical = tourist.threat_level === 'CRITICAL';
  const isWarning = tourist.threat_level === 'WARNING';

  // Filter last 5 emergency/alert events for display
  const alertEvents = recent_events?.filter(e =>
    ['SENSOR_ALERT', 'IMMOBILITY', 'EMERGENCY_CREATED', 'FALL_DETECTED', 'COMMS_FALLBACK', 'RESOLVED'].includes(e.event_type)
  ).slice(0, 5) || [];

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-200 border-b border-tactical-border/60 pb-1.5">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-tactical-cyan" />
          SAFETY & NETWORK STATUS
        </span>
        <span className="text-tactical-muted">LIVE MONITORING</span>
      </div>

      {/* Current Threat Level — Full Width Card */}
      <div className={`p-3 rounded border flex items-center justify-between ${
        isCritical ? 'border-rose-500 bg-rose-950/40 shadow-crimson-glow' :
        isWarning ? 'border-amber-500 bg-amber-950/30 shadow-amber-glow' :
        'border-emerald-500/50 bg-emerald-950/20'
      }`}>
        <div className="flex items-center gap-2">
          {isCritical ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
          ) : (
            <Shield className="w-5 h-5 text-emerald-400" />
          )}
          <div>
            <div className={`text-xs font-mono font-black ${isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-emerald-300'}`}>
              THREAT LEVEL: {tourist.threat_level}
            </div>
            <div className="text-[9px] font-mono text-tactical-muted">
              {isCritical ? 'Emergency protocol active — rescue initiated' :
               isWarning ? 'Anomaly detected — AI evaluating' :
               'All biometrics nominal — Continuous guard active'}
            </div>
          </div>
        </div>
        <StatusBadge status={tourist.threat_level} size="xs" pulse={isCritical || isWarning} />
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        {/* Geofence */}
        <div className="p-2.5 rounded border border-tactical-border bg-tactical-card/60 space-y-1">
          <div className="text-tactical-muted font-bold uppercase text-[9px]">GEOFENCE</div>
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            INSIDE SAFE ZONE
          </div>
          <div className="text-tactical-muted text-[9px]">Yosemite-Alpha boundary</div>
        </div>

        {/* Uplink */}
        <div className="p-2.5 rounded border border-tactical-border bg-tactical-card/60 space-y-1">
          <div className="text-tactical-muted font-bold uppercase text-[9px]">UPLINK STATUS</div>
          <div className={`flex items-center gap-1.5 font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'CONNECTED' : 'OFFLINE'}
          </div>
          <div className="text-tactical-muted text-[9px]">WebSocket 5Hz live stream</div>
        </div>

        {/* Network / LoRa */}
        <div className={`p-2.5 rounded border space-y-1 ${isLoRa ? 'border-amber-500/60 bg-amber-950/30' : 'border-tactical-border bg-tactical-card/60'}`}>
          <div className="text-tactical-muted font-bold uppercase text-[9px]">COMMS CHANNEL</div>
          <div className={`flex items-center gap-1.5 font-bold ${isLoRa ? 'text-amber-400' : 'text-tactical-cyan'}`}>
            <Radio className="w-3.5 h-3.5" />
            {isLoRa ? 'LORA 868MHz' : '4G LTE'}
          </div>
          <div className="text-tactical-muted text-[9px]">
            {isLoRa ? 'LoRa mesh failover ACTIVE' : 'Primary cellular link'}
          </div>
        </div>

        {/* Sensor status */}
        <div className="p-2.5 rounded border border-tactical-border bg-tactical-card/60 space-y-1">
          <div className="text-tactical-muted font-bold uppercase text-[9px]">SENSOR ARRAY</div>
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            OPERATIONAL
          </div>
          <div className="text-tactical-muted text-[9px]">Accel, HR, GPS, LoRa OK</div>
        </div>
      </div>

      {/* AI Scan & Fall Detection */}
      <div className="p-2.5 rounded border border-tactical-border/80 bg-tactical-card/50 space-y-2 text-[10px] font-mono">
        <div className="text-[9px] font-bold text-tactical-muted uppercase border-b border-tactical-border/50 pb-1">
          AI GUARD STATUS
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border">
            <div className="text-[8px] text-tactical-muted">FALL DETECT</div>
            <div className={`font-bold text-xs ${isCritical ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {isCritical ? 'TRIGGERED' : 'CLEAR'}
            </div>
          </div>
          <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border">
            <div className="text-[8px] text-tactical-muted">INACTIVITY</div>
            <div className={`font-bold text-xs ${isCritical ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {isCritical ? 'DETECTED' : 'NORMAL'}
            </div>
          </div>
          <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border">
            <div className="text-[8px] text-tactical-muted">ANOMALY SCORE</div>
            <div className={`font-bold text-xs ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isCritical ? '0.98' : isWarning ? '0.62' : '0.02'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-tactical-cyan" />
          <span className="text-tactical-muted text-[9px]">
            G-Force: <span className="text-white font-bold">{tourist.g_force.toFixed(2)}g</span> &nbsp;|&nbsp;
            Heart Rate: <span className="text-white font-bold">{tourist.heart_rate} BPM</span> &nbsp;|&nbsp;
            Step Count: <span className="text-white font-bold">{tourist.step_counter}</span>
          </span>
        </div>
      </div>

      {/* Safety Node Infrastructure */}
      <div className="p-2.5 rounded border border-tactical-border/80 bg-tactical-card/50 space-y-1.5 text-[10px] font-mono">
        <div className="text-[9px] font-bold text-tactical-muted uppercase border-b border-tactical-border/50 pb-1">
          SAFETY INFRASTRUCTURE — SECTOR NODES
        </div>
        {[
          { name: 'Tactical Alpha Hub (Ranger HQ)', type: 'COMMAND', status: 'ONLINE', dist: '640m N' },
          { name: 'UAV Drone Base (Pad 01)', type: 'UAV LAUNCH', status: 'ONLINE', dist: '730m NE' },
          { name: 'Ground Rescue Outpost (Echo-4)', type: 'RESCUE', status: 'STANDBY', dist: '550m N' },
          { name: 'LoRa Mesh Gateway Node-03', type: 'COMMS', status: 'ACTIVE', dist: '210m E' }
        ].map((node, idx) => (
          <div key={idx} className="flex items-center justify-between py-0.5 border-b border-tactical-border/30 last:border-b-0">
            <div>
              <div className="text-slate-200 font-semibold">{node.name}</div>
              <div className="text-[8px] text-tactical-muted">{node.type} — {node.dist}</div>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              node.status === 'ONLINE' ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' :
              node.status === 'ACTIVE' ? 'text-tactical-cyan border-tactical-cyan/40 bg-tactical-darkest' :
              'text-amber-400 border-amber-500/40 bg-amber-950/30'
            }`}>
              {node.status}
            </span>
          </div>
        ))}
      </div>

      {/* Emergency History */}
      <div className="p-2.5 rounded border border-tactical-border/80 bg-tactical-card/50 space-y-1.5 text-[10px] font-mono">
        <div className="text-[9px] font-bold text-tactical-muted uppercase border-b border-tactical-border/50 pb-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-tactical-cyan" />
          RECENT SAFETY EVENTS
        </div>
        {alertEvents.length > 0 ? alertEvents.map((ev, idx) => (
          <div key={ev.id || idx} className="flex items-center gap-2 text-[9px] text-slate-300">
            <span className="text-tactical-muted shrink-0">{ev.timestamp || '--:--:--'}</span>
            <span className="font-bold truncate">{ev.title}</span>
          </div>
        )) : (
          <div className="text-tactical-muted text-[9px]">No safety events recorded in this session.</div>
        )}
      </div>
    </div>
  );
}
