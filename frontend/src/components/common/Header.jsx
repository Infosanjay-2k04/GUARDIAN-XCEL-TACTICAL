import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Shield, Radio, Activity, Navigation, Eye, LayoutGrid } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Header({ currentRoute, setCurrentRoute }) {
  const { isConnected, tourist, active_incident, demo_status_text } = useSystem();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC' + (now.getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(now.getTimezoneOffset() / 60));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'mobile', label: '1. MOBILE PWA', path: '/mobile', icon: Shield },
    { id: 'tactical', label: '2. TACTICAL HUB', path: '/tactical', icon: Radio },
    { id: 'uav', label: '3. UAV OPS & FLIR', path: '/uav', icon: Eye },
    { id: 'deck', label: 'MASTER DECK (3-IN-1)', path: '/deck', icon: LayoutGrid }
  ];

  return (
    <header 
      className="border-b border-tactical-border/70 bg-tactical-darkest/95 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-3 select-none"
      style={{ zIndex: 9999, position: 'relative', pointerEvents: 'auto' }}
    >
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded bg-tactical-card border border-tactical-cyan/40 shadow-cyan-glow">
          <Shield className="w-5 h-5 text-tactical-cyan animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black tracking-wider text-base text-white">
              GUARDIAN <span className="text-tactical-cyan">XCEL</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan font-bold">
              PROTOTYPE
            </span>
          </div>
          <p className="text-[10px] font-mono text-tactical-muted tracking-tight">
            AUTONOMOUS EMERGENCY DETECTION &amp; DRONE RESCUE COORDINATION
          </p>
        </div>
      </div>

      {/* Interface Navigation Tabs */}
      <nav 
        className="flex items-center gap-1 bg-tactical-dark/90 p-1 rounded border border-tactical-border"
        style={{ position: 'relative', zIndex: 10000, pointerEvents: 'auto' }}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentRoute(item.id);
                try {
                  window.history.pushState({}, '', item.path);
                } catch (err) {
                  // PushState fallback
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-tactical-cyan/20 border border-tactical-cyan text-white shadow-cyan-glow'
                  : 'text-slate-400 hover:text-white hover:bg-tactical-card'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-tactical-cyan' : 'text-tactical-muted'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Telemetry & System Clock */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-[10px] text-tactical-muted uppercase">SYS_TIME // LIVE</span>
          <span className="text-white font-bold tracking-wider">{timeStr}</span>
        </div>

        <div className="flex items-center gap-2 border-l border-tactical-border/60 pl-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-tactical-muted uppercase">LINK STATUS</span>
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={`text-[11px] font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isConnected ? 'LIVE WS' : 'OFFLINE'}
              </span>
            </span>
          </div>

          <div className="flex flex-col items-end pl-2">
            <span className="text-[10px] text-tactical-muted uppercase">THREAT LEVEL</span>
            <StatusBadge
              status={tourist?.threat_level || 'NORMAL'}
              size="xs"
              pulse={tourist?.threat_level === 'CRITICAL'}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
