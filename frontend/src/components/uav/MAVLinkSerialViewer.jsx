import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Terminal, Cpu, Radio, Play, Pause, RefreshCw, Copy, Check } from 'lucide-react';

export default function MAVLinkSerialViewer() {
  const { uav } = useSystem();
  const [isPaused, setIsPaused] = useState(false);
  const [frames, setFrames] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString() + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const mav = uav.mavlink || {};

      const packetTypes = [
        {
          name: 'SYS_STATUS',
          id: 1,
          len: 31,
          hex: `FD 1F 00 00 01 01 01 ${Math.round(mav.SYS_STATUS?.voltage_battery * 100 || 2400).toString(16).padStart(4, '0')} ${Math.round(mav.SYS_STATUS?.current_battery * 10 || 150).toString(16).padStart(4, '0')} ${Math.round(uav.battery_pct || 98).toString(16).padStart(2, '0')} 00 00`
        },
        {
          name: 'ATTITUDE',
          id: 30,
          len: 28,
          hex: `FD 1C 00 00 01 01 1E ${(Math.round((uav.roll_deg || 0) * 100) & 0xFFFF).toString(16).padStart(4, '0')} ${(Math.round((uav.pitch_deg || 0) * 100) & 0xFFFF).toString(16).padStart(4, '0')} ${(Math.round((uav.heading_deg || 0) * 100) & 0xFFFF).toString(16).padStart(4, '0')}`
        },
        {
          name: 'GLOBAL_POSITION_INT',
          id: 33,
          len: 28,
          hex: `FD 1C 00 00 01 01 21 ${(Math.round(uav.current_lat * 1e5) & 0xFFFFFFFF).toString(16).padStart(8, '0')} ${(Math.round(Math.abs(uav.current_lon) * 1e5) & 0xFFFFFFFF).toString(16).padStart(8, '0')} ${Math.round(uav.altitude_agl * 1000).toString(16).padStart(4, '0')}`
        },
        {
          name: 'MAV_CMD_NAV_WAYPOINT',
          id: 16,
          len: 37,
          hex: `FD 25 00 00 01 01 10 ${(mav.MISSION_CURRENT?.seq || 1).toString(16).padStart(2, '0')} 03 00 00 00 00 00 00 42 34 00 00`
        }
      ];

      const chosen = packetTypes[Math.floor(Math.random() * packetTypes.length)];
      setFrames(prev => [
        {
          timestamp: timeStr,
          ...chosen
        },
        ...prev.slice(0, 19)
      ]);
    }, 450);

    return () => clearInterval(interval);
  }, [isPaused, uav]);

  const handleCopy = () => {
    const text = frames.map(f => `[${f.timestamp}] MAVLINK_MSG_ID_${f.name} (len=${f.len}) -> ${f.hex}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2 font-mono text-[10px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-bold text-slate-200">
        <div className="flex items-center gap-1.5 text-tactical-cyan">
          <Cpu className="w-4 h-4 text-tactical-cyan" />
          <span>MAVLINK 2.0 SERIAL TELEMETRY STREAM (115200 BAUD)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-tactical-card hover:bg-tactical-cardHover border border-tactical-border text-[9px] text-slate-300"
          >
            {isPaused ? <Play className="w-2.5 h-2.5 text-emerald-400" /> : <Pause className="w-2.5 h-2.5 text-amber-400" />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-tactical-card hover:bg-tactical-cardHover border border-tactical-border text-[9px] text-slate-300"
          >
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
      </div>

      {/* Hex Stream Terminal */}
      <div className="flex-1 bg-black/90 p-2 rounded border border-cyan-950/80 overflow-y-auto space-y-1 max-h-48 text-[9px]">
        {frames.map((frame, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 border-b border-cyan-950/40 pb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-tactical-muted text-[8px]">{frame.timestamp}</span>
              <span className="text-tactical-cyan font-bold">MSG_ID_{frame.name}</span>
            </div>
            <code className="text-emerald-400 tracking-wider truncate font-mono text-[8px]">
              {frame.hex}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
