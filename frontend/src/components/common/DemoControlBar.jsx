import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Play, RotateCcw, Activity, ShieldAlert, Crosshair, Truck, CheckCircle2 } from 'lucide-react';
import DroneIcon from './DroneIcon';

export default function DemoControlBar({ compact = false }) {
  const { demo_step, demo_status_text, startDemo, resetSystem } = useSystem();

  const steps = [
    { step: 1, label: '1. Normal' },
    { step: 2, label: '2. Fall Impact' },
    { step: 3, label: '3. Immobility' },
    { step: 4, label: '4. UGID & LoRa' },
    { step: 5, label: '5. Tactical Triage' },
    { step: 6, label: '6. UAV En Route' },
    { step: 7, label: '7. Search Grid' },
    { step: 8, label: '8. FLIR Lock' },
    { step: 9, label: '9. Ground Rescue' },
    { step: 10, label: '10. Resolved' }
  ];

  const isDemoRunning = demo_step > 0 && demo_step < 10;

  return (
    <div className="bg-tactical-darkest/95 border-b border-tactical-border/80 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <button
          onClick={startDemo}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded font-mono font-black text-xs uppercase tracking-wider transition-all duration-300 ${
            isDemoRunning
              ? 'bg-rose-600 text-white animate-pulse shadow-crimson-glow border border-rose-400'
              : 'bg-tactical-cyan hover:bg-cyan-400 text-black shadow-cyan-glow hover:shadow-cyan-glow border border-cyan-200'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {isDemoRunning ? 'RESCUE DEMO IN PROGRESS...' : 'RUN FULL RESCUE DEMO'}
        </button>

        <button
          onClick={resetSystem}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-tactical-card hover:bg-tactical-cardHover text-slate-300 hover:text-white border border-tactical-border text-xs font-mono font-bold tracking-wider transition-all"
          title="Reset to baseline monitoring state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          RESET
        </button>
      </div>

      {/* Step Status Readout */}
      <div className="flex-1 w-full md:w-auto flex flex-col justify-center">
        <div className="flex items-center justify-between gap-2 mb-1 text-[11px] font-mono">
          <span className="text-tactical-cyan font-bold tracking-wide flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-tactical-cyan animate-ping" />
            {demo_status_text}
          </span>
          <span className="text-tactical-muted font-mono shrink-0">
            PHASE {demo_step}/10
          </span>
        </div>

        {/* 10-Step Visual Flow */}
        <div className="grid grid-cols-10 gap-1 w-full">
          {steps.map(s => {
            const isCompleted = demo_step > s.step || demo_step === 10;
            const isCurrent = demo_step === s.step;
            return (
              <div
                key={s.step}
                className={`h-2 rounded-xs transition-all duration-300 relative group cursor-default ${
                  isCurrent
                    ? 'bg-tactical-cyan shadow-cyan-glow animate-pulse'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-tactical-border/60'
                }`}
                title={s.label}
              >
                {!compact && (
                  <div className="hidden lg:block absolute -bottom-4 left-0 text-[8px] font-mono text-tactical-muted whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                    {s.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
