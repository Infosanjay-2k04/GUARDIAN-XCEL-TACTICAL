import React from 'react';

export default function StatusBadge({ status, label, size = 'sm', pulse = false }) {
  const getColors = () => {
    switch (status) {
      case 'NORMAL':
      case 'SECURE':
      case 'TARGET_LOCKED':
      case 'ON_SCENE':
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          glow: 'shadow-emerald-glow'
        };
      case 'WARNING':
      case 'EVALUATING':
      case 'SEARCHING':
      case 'EN_ROUTE_LKP':
      case 'DISPATCHED':
      case 'RESCUE_EN_ROUTE':
        return {
          bg: 'bg-amber-950/60',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
          glow: 'shadow-amber-glow'
        };
      case 'CRITICAL':
      case 'FALL_DETECTED':
      case 'IMMOBILE':
      case 'MANUAL_SOS':
      case 'CONFIRMED':
        return {
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/60',
          text: 'text-rose-400',
          dot: 'bg-rose-400',
          glow: 'shadow-crimson-glow'
        };
      case 'STANDBY':
      case 'IDLE':
      default:
        return {
          bg: 'bg-slate-900/60',
          border: 'border-tactical-cyan/40',
          text: 'text-tactical-cyan',
          dot: 'bg-tactical-cyan',
          glow: 'shadow-cyan-glow'
        };
    }
  };

  const style = getColors();
  const textLabel = label || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold border rounded-sm px-2 py-0.5 ${
        size === 'xs' ? 'text-[10px]' : size === 'lg' ? 'text-sm py-1 px-3' : 'text-xs'
      } ${style.bg} ${style.border} ${style.text} ${pulse ? style.glow : ''}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${style.dot} ${
          pulse ? 'animate-ping' : ''
        }`}
      />
      {textLabel}
    </span>
  );
}
