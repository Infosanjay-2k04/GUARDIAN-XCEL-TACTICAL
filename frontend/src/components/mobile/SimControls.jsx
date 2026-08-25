import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Footprints, Activity, AlertOctagon, UserX, RadioTower, AlertTriangle } from 'lucide-react';

export default function SimControls({ compact = false }) {
  const { triggerSim, comms } = useSystem();
  const [lastTriggered, setLastTriggered] = useState(null);

  const trigger = async (mode) => {
    setLastTriggered(mode);
    await triggerSim(mode);
    setTimeout(() => setLastTriggered(null), 1200);
  };

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-tactical-border/50 pb-1.5">
        <span className="text-slate-300 font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          DEMO SENSOR SIMULATION CONTROLS
        </span>
        <span className="text-tactical-cyan text-[9px]">REAL 5Hz BACKEND EVENTS</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => trigger('NORMAL')}
          className={`flex items-center justify-center gap-1.5 p-2 rounded border text-[11px] font-mono font-bold transition-all active:scale-95 ${
            lastTriggered === 'NORMAL'
              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-95'
              : 'bg-tactical-card hover:bg-tactical-cardHover border-tactical-border text-slate-200 hover:text-white'
          }`}
        >
          <Footprints className="w-3.5 h-3.5 text-emerald-400" />
          NORMAL WALK
        </button>

        <button
          onClick={() => trigger('ABNORMAL')}
          className={`flex items-center justify-center gap-1.5 p-2 rounded border text-[11px] font-mono font-bold transition-all active:scale-95 ${
            lastTriggered === 'ABNORMAL'
              ? 'bg-amber-500/40 border-amber-400 text-amber-100 scale-95'
              : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/50 text-amber-300 hover:text-amber-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          ABNORMAL MOTION
        </button>

        <button
          onClick={() => trigger('FALL')}
          className={`flex items-center justify-center gap-1.5 p-2 rounded border text-[11px] font-mono font-bold transition-all active:scale-95 ${
            lastTriggered === 'FALL'
              ? 'bg-amber-500/40 border-amber-400 text-amber-100 scale-95'
              : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/50 text-amber-300 hover:text-amber-200 shadow-amber-glow'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          SIMULATE FALL (3.8G)
        </button>

        <button
          onClick={() => trigger('IMMOBILE')}
          className={`flex items-center justify-center gap-1.5 p-2 rounded border text-[11px] font-mono font-bold transition-all active:scale-95 ${
            lastTriggered === 'IMMOBILE'
              ? 'bg-rose-500/40 border-rose-400 text-rose-100 scale-95'
              : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/50 text-rose-300 hover:text-rose-200'
          }`}
        >
          <UserX className="w-3.5 h-3.5 text-rose-400" />
          SIMULATE IMMOBILITY
        </button>
      </div>

      <button
        onClick={() => trigger('LORA_DROP')}
        className={`w-full flex items-center justify-center gap-2 p-2 rounded border text-[11px] font-mono font-bold transition-all active:scale-95 ${
          comms.channel === 'LORA_MESH'
            ? 'bg-tactical-cyan/20 border-tactical-cyan text-white shadow-cyan-glow'
            : 'bg-tactical-card hover:bg-tactical-cardHover border-tactical-border text-slate-300 hover:text-white'
        }`}
      >
        <RadioTower className="w-4 h-4 text-tactical-cyan" />
        {comms.channel === 'LORA_MESH' ? 'LORA 868MHz MESH ACTIVE (FAILOVER)' : 'SIMULATE CELLULAR LOSS -> LORA FAILOVER'}
      </button>
    </div>
  );
}
