import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Terminal, Clock, Shield, Key, Radio, Wifi, WifiOff } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function TimelineLog() {
  const { recent_events, isConnected, comms } = useSystem();

  const isLoRa = comms.channel === 'LORA_MESH';

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2">
      {/* Header with Comms Indicators */}
      <div className="flex flex-wrap items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200 gap-2">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-tactical-cyan" />
          LIVE EVENT TIMELINE & CRYPTOGRAPHIC STREAM
        </span>

        {/* Communication Indicators */}
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
            <span className="text-tactical-cyan font-bold">WEBSOCKET: 5Hz</span>
          </div>

          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all ${
            isLoRa ? 'bg-amber-950/60 border-amber-500 text-amber-400 shadow-amber-glow animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}>
            <Radio className="w-3 h-3" />
            <span className="font-bold">LORA FALLBACK: {isLoRa ? 'ACTIVE' : 'STANDBY'}</span>
          </div>
        </div>
      </div>

      {/* Timestamped Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-48 text-[10px] font-mono">
        {recent_events && recent_events.length > 0 ? (
          recent_events.map(ev => {
            const isAlert = ev.event_type === 'SENSOR_ALERT' || ev.event_type === 'IMMOBILITY' || ev.event_type === 'EMERGENCY_CREATED';
            const isUav = ev.event_type === 'UAV_LAUNCH' || ev.event_type === 'TARGET_DETECT' || ev.event_type === 'LKP_REACHED' || ev.event_type === 'SEARCH_START';
            const isRescue = ev.event_type === 'RESCUE_DISPATCH' || ev.event_type === 'ON_SCENE' || ev.event_type === 'RESOLVED';
            const isLoRaEv = ev.event_type === 'COMMS_FALLBACK';

            return (
              <div
                key={ev.id}
                className={`p-1.5 rounded border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                  isAlert 
                    ? 'bg-rose-950/25 border-rose-500/40 text-rose-300' 
                    : isLoRaEv 
                    ? 'bg-amber-950/25 border-amber-500/40 text-amber-300'
                    : isUav 
                    ? 'bg-cyan-950/25 border-tactical-cyan/40 text-cyan-200'
                    : isRescue
                    ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                    : 'bg-tactical-card/70 border-tactical-border text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-tactical-muted font-bold flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-tactical-cyan" />
                    {ev.title.includes('—') ? ev.title.split('—')[0].trim() : ev.timestamp}
                  </span>
                  <span className="font-bold text-white tracking-wide truncate">
                    {ev.title.includes('—') ? ev.title.split('—')[1].trim() : ev.title}
                  </span>
                  {ev.description && (
                    <span className="text-slate-400 text-[9px] hidden md:inline truncate">
                      — {ev.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[8px] uppercase px-1 py-0.5 rounded bg-black/60 border border-tactical-border text-slate-300 font-semibold">
                    {ev.source}
                  </span>
                  {ev.cryptographic_hash && (
                    <span className="text-[8px] text-tactical-muted hidden lg:inline">
                      SHA: {ev.cryptographic_hash}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-600 font-mono text-[10px] py-4">
            Awaiting system dispatch events...
          </div>
        )}
      </div>
    </div>
  );
}
