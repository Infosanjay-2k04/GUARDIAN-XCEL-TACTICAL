import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Users, Shield, AlertTriangle, Flame, Heart, Battery, User, Phone, Crosshair, QrCode } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function TouristMonitor() {
  const { tourists_list, tourist_stats, selectedUgid, setSelectedUgid, tourist } = useSystem();

  const selectedTourist = tourists_list?.find(t => t.ugid === selectedUgid) || tourist;

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col h-full gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono font-bold text-slate-200">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-tactical-cyan" />
          TOURIST MONITORING
        </span>
        <span className="text-[10px] text-tactical-muted font-normal">
          LIVE GPS BEACONS
        </span>
      </div>

      {/* Summary Stat Counters */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="p-1.5 rounded bg-tactical-darkest border border-tactical-border">
          <div className="text-[8px] font-mono text-tactical-muted uppercase">TOTAL</div>
          <div className="text-sm font-display font-bold text-white">
            {tourist_stats?.total || 4}
          </div>
        </div>

        <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/40">
          <div className="text-[8px] font-mono text-emerald-400 uppercase">SAFE</div>
          <div className="text-sm font-display font-bold text-emerald-400">
            {tourist_stats?.safe || 3}
          </div>
        </div>

        <div className="p-1.5 rounded bg-amber-950/40 border border-amber-500/40">
          <div className="text-[8px] font-mono text-amber-400 uppercase">AT RISK</div>
          <div className="text-sm font-display font-bold text-amber-400">
            {tourist_stats?.at_risk || 0}
          </div>
        </div>

        <div className={`p-1.5 rounded border transition-all ${
          (tourist_stats?.emergency || 0) > 0 
            ? 'bg-rose-950/60 border-rose-500 text-rose-400 shadow-crimson-glow animate-pulse' 
            : 'bg-tactical-darkest border-tactical-border text-slate-500'
        }`}>
          <div className="text-[8px] font-mono uppercase">EMERGENCY</div>
          <div className="text-sm font-display font-bold">
            {tourist_stats?.emergency || 0}
          </div>
        </div>
      </div>

      {/* Interactive Tourist List */}
      <div className="space-y-1.5 overflow-y-auto max-h-48 pr-0.5">
        <div className="text-[9px] font-mono text-tactical-muted uppercase font-bold px-1">
          REGISTERED BEACONS ({tourists_list?.length || 0})
        </div>
        {tourists_list?.map(t => {
          const isSelected = t.ugid === selectedUgid;
          const isEmergency = t.threat_level === 'CRITICAL';
          const isAtRisk = t.threat_level === 'WARNING';

          return (
            <button
              key={t.ugid}
              onClick={() => setSelectedUgid(t.ugid)}
              className={`w-full text-left p-2 rounded border text-[10px] font-mono transition-all flex items-center justify-between gap-2 ${
                isSelected
                  ? 'bg-tactical-cyan/15 border-tactical-cyan text-white shadow-cyan-glow'
                  : 'bg-tactical-card/70 hover:bg-tactical-cardHover border-tactical-border text-slate-300'
              } ${isEmergency ? 'border-rose-500 bg-rose-950/40' : ''}`}
            >
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isEmergency ? 'bg-rose-500 animate-ping' : isAtRisk ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="font-bold tracking-wide">{t.ugid}</span>
                </div>
                <span className="text-[9px] text-slate-400 truncate">{t.full_name}</span>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <StatusBadge
                  status={t.threat_level === 'CRITICAL' ? 'CRITICAL' : t.threat_level === 'WARNING' ? 'WARNING' : 'SECURE'}
                  label={t.threat_level === 'CRITICAL' ? 'EMERGENCY' : t.threat_level === 'WARNING' ? 'AT RISK' : 'SAFE'}
                  size="xs"
                />
                <div className="flex items-center gap-2 text-[8px] text-slate-400 mt-0.5">
                  <span>{t.heart_rate} BPM</span>
                  <span>{t.battery_pct}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Tourist Inspector Card */}
      {selectedTourist && (
        <div className="p-2.5 rounded bg-tactical-card/90 border border-tactical-border/90 text-[10px] font-mono space-y-1.5 mt-auto">
          <div className="flex items-center justify-between text-slate-200 font-bold border-b border-tactical-border/60 pb-1">
            <span className="flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-tactical-cyan" />
              INSPECTOR: {selectedTourist.ugid}
            </span>
            <span className="text-tactical-cyan font-bold">{selectedTourist.blood_type}</span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-tactical-muted">Hiker:</span>
              <span className="font-semibold text-white">{selectedTourist.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tactical-muted">Emergency Contact:</span>
              <span className="text-slate-300">{selectedTourist.emergency_contact}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tactical-muted">Medical Notes:</span>
              <span className="text-amber-300 truncate max-w-[170px]">{selectedTourist.medical_notes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tactical-muted">GPS Coordinates:</span>
              <span className="text-slate-200 font-bold">
                {selectedTourist.current_lat.toFixed(4)}°N, {Math.abs(selectedTourist.current_lon).toFixed(4)}°W
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-tactical-muted">Uplink Channel:</span>
              <span className="text-tactical-cyan font-bold">{selectedTourist.comms_channel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
