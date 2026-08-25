import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

export default function ThreatGauge({ threatLevel, gForce, heartRate }) {
  const isCritical = threatLevel === 'CRITICAL';
  const isWarning = threatLevel === 'WARNING';
  const isNormal = threatLevel === 'NORMAL';

  const getColor = () => {
    if (isCritical) return { stroke: '#ff2255', text: 'text-rose-500', glow: 'shadow-crimson-glow', label: 'CRITICAL THREAT' };
    if (isWarning) return { stroke: '#ffb700', text: 'text-amber-400', glow: 'shadow-amber-glow', label: 'WARNING // EVALUATING' };
    return { stroke: '#00ff9d', text: 'text-emerald-400', glow: 'shadow-emerald-glow', label: 'SECURE // NORMAL' };
  };

  const current = getColor();
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  
  // Threat percentage for circle stroke
  const pct = isCritical ? 98 : isWarning ? 65 : 12;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-4 tactical-box rounded border border-tactical-border/90 bg-tactical-dark/95">
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-tactical-muted mb-2 border-b border-tactical-border/50 pb-1">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tactical-cyan animate-pulse" />
          AI THREAT VECTOR
        </span>
        <span className="text-tactical-cyan font-bold">RADAR LINKED</span>
      </div>

      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            className="text-tactical-darkest"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={current.stroke}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {isCritical ? (
            <Flame className="w-8 h-8 text-rose-500 animate-bounce" />
          ) : isWarning ? (
            <AlertTriangle className="w-7 h-7 text-amber-400 animate-pulse" />
          ) : (
            <Shield className="w-7 h-7 text-emerald-400" />
          )}
          <span className={`text-xl font-display font-black tracking-wider ${current.text} mt-0.5`}>
            {isCritical ? 'ALERT' : isWarning ? 'WARN' : 'SECURE'}
          </span>
          <span className="text-[10px] font-mono text-tactical-muted">
            {gForce.toFixed(2)}G / {heartRate} BPM
          </span>
        </div>
      </div>

      {/* Bottom Sub-label */}
      <div className={`mt-1 text-xs font-mono font-bold tracking-widest uppercase ${current.text}`}>
        {current.label}
      </div>
    </div>
  );
}
