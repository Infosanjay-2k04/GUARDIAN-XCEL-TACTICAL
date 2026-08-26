import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldAlert, Crosshair, Truck, RotateCcw, Play, CheckCircle2, Activity } from 'lucide-react';
import DroneIcon from './DroneIcon';

export default function DemoControlBar({ compact = false }) {
  const { 
    demo_step, 
    demo_status_text, 
    triggerManualStep1_SOS,
    triggerManualStep2_UAVSearch,
    triggerManualStep3_GroundRescue,
    resetSystem,
    startDemo,
    isDemoRunning
  } = useSystem();

  const isStep1Active = demo_step === 1 || demo_step === 2 || demo_step === 3 || demo_step === 4 || demo_step === 5;
  const isStep2Active = demo_step === 6 || demo_step === 7 || demo_step === 8;
  const isStep3Active = demo_step === 9 || demo_step === 10;

  return (
    <div 
      className="bg-tactical-darkest/95 border-b border-tactical-border/80 px-4 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3 select-none"
      style={{ position: 'relative', zIndex: 9998, pointerEvents: 'auto' }}
    >
      {/* 3-Step Clean Manual Jury Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-tactical-muted uppercase tracking-wider mr-1">
          JURY DEMO:
        </span>

        {/* Step 1: Trigger Fall / SOS */}
        <button
          onClick={triggerManualStep1_SOS}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
            isStep1Active && !isStep2Active && !isStep3Active
              ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border-rose-700/60 hover:border-rose-500'
          }`}
          title="Step 1: Simulate 3.8g impact spike, lock Last Known Position (LKP) at victim GPS coordinates, and activate multi-agency emergency alert."
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>1. TRIGGER SOS / FALL</span>
        </button>

        {/* Step 2: Launch UAV Search */}
        <button
          onClick={triggerManualStep2_UAVSearch}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
            isStep2Active
              ? 'bg-cyan-600 text-white border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.7)] animate-pulse'
              : 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white border-cyan-700/60 hover:border-cyan-500'
          }`}
          title="Step 2: Dispatch UAV from Base Pad directly to LKP coordinates and lock FLIR thermal target crosshairs (36.8°C core body heat)."
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>2. LAUNCH UAV SEARCH</span>
        </button>

        {/* Step 3: Dispatch Ground Unit */}
        <button
          onClick={triggerManualStep3_GroundRescue}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
            isStep3Active
              ? 'bg-emerald-600 text-white border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white border-emerald-700/60 hover:border-emerald-500'
          }`}
          title="Step 3: Route Ground Tactical Unit Echo-4 to victim LKP, mark incident as RESOLVED, and seal SHA-256 Merkle ledger hash."
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>3. DISPATCH GROUND UNIT</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSystem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-tactical-card hover:bg-tactical-cardHover text-slate-300 hover:text-white border border-tactical-border text-xs font-mono font-bold tracking-wider transition-all ml-1 cursor-pointer"
          title="Reset complete system to nominal baseline state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Live Active Status Readout Badge */}
      <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
        <div className="bg-tactical-card/90 border border-tactical-border px-3 py-1.5 rounded flex items-center gap-2 max-w-full truncate">
          <span className="w-2 h-2 rounded-full bg-tactical-cyan animate-ping shrink-0" />
          <span className="text-[11px] font-mono text-tactical-cyan font-bold truncate">
            {demo_status_text || 'SYSTEM READY // NOMINAL MONITORING'}
          </span>
        </div>

        {/* Optional 10-Phase Auto Demo button */}
        <button
          onClick={startDemo}
          className={`hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded border text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
            isDemoRunning
              ? 'bg-amber-600/80 text-white border-amber-400 animate-pulse'
              : 'bg-tactical-card hover:bg-tactical-cardHover text-slate-400 hover:text-slate-200 border-tactical-border'
          }`}
          title="Auto-run complete 10-phase sequence (55s)"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isDemoRunning ? 'AUTO DEMO...' : 'AUTO 55s'}</span>
        </button>
      </div>
    </div>
  );
}
