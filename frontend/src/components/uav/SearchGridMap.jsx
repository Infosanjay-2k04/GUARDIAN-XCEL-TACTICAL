import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Crosshair, Navigation, CheckCircle2, Zap } from 'lucide-react';

export default function SearchGridMap() {
  const { uav } = useSystem();

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Crosshair className="w-4 h-4 text-tactical-cyan" />
          AUTONOMOUS SEARCH PATTERN & COVERAGE
        </span>
        <span className="text-[10px] text-tactical-cyan font-bold">
          {uav.search_pattern}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">SECTOR COVERAGE:</span>
          <span className="text-tactical-cyan font-bold">{uav.search_progress_pct}%</span>
        </div>
        <div className="w-full h-2 rounded bg-tactical-darkest border border-tactical-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-tactical-cyan to-emerald-400 transition-all duration-300 shadow-cyan-glow"
            style={{ width: `${uav.search_progress_pct}%` }}
          />
        </div>
      </div>

      {/* Search Grid Vector Graphic */}
      <div className="relative h-32 rounded bg-tactical-darkest border border-tactical-border/80 overflow-hidden flex items-center justify-center">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(#00f0ff 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} />

        {/* Expanding square vector representation */}
        <svg className="w-full h-full p-2" viewBox="-100 -100 200 200">
          {/* Concentric expanding search legs */}
          <path
            d="M 0,0 L 20,0 L 20,20 L -20,20 L -20,-20 L 40,-20 L 40,40 L -40,40 L -40,-40 L 60,-40 L 60,60 L -60,60"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeDasharray="4, 3"
            opacity="0.6"
          />

          {/* Center LKP point */}
          <circle cx="0" cy="0" r="4" fill="#ff2255" className="animate-ping" />
          <circle cx="0" cy="0" r="3" fill="#ff2255" />

          {/* Current UAV Position dot moving along path */}
          {uav.status === 'SEARCHING' && (
            <circle
              cx={Math.sin(Date.now() / 800) * 50}
              cy={Math.cos(Date.now() / 800) * 50}
              r="4"
              fill="#00ff9d"
              className="shadow-emerald-glow"
            />
          )}

          {/* Confirmed Target Pin */}
          {uav.target_locked && (
            <g transform="translate(15, -10)">
              <circle cx="0" cy="0" r="6" fill="#00ff9d" opacity="0.4" className="animate-ping" />
              <circle cx="0" cy="0" r="3" fill="#00ff9d" />
            </g>
          )}
        </svg>

        {/* Target Acquisition Callout */}
        {uav.target_locked && (
          <div className="absolute bottom-2 bg-emerald-950/90 border border-emerald-500 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-300 font-bold flex items-center gap-1 shadow-emerald-glow">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            TARGET ACQUIRED // {Math.abs(uav.target_lat || 11.3995).toFixed(4)}°{(uav.target_lat || 11.3995) >= 0 ? 'N' : 'S'}, {Math.abs(uav.target_lon || 78.1614).toFixed(4)}°{(uav.target_lon || 78.1614) >= 0 ? 'E' : 'W'}
          </div>
        )}
      </div>
    </div>
  );
}
