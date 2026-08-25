import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { User, QrCode, Shield, Phone, Lock, Key, Fingerprint, BadgeCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ProfileScreen() {
  const { tourist, comms, isConnected } = useSystem();

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-200 border-b border-tactical-border/60 pb-1.5">
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-tactical-cyan" />
          HIKER PROFILE & IDENTITY
        </span>
        <StatusBadge status="SECURE" label="VERIFIED" size="xs" />
      </div>

      {/* UGID Identity Card */}
      <div className="p-3.5 rounded border border-tactical-cyan/60 bg-tactical-card/80 space-y-3 shadow-cyan-glow">
        {/* Card top row */}
        <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded border border-tactical-cyan/50 bg-tactical-darkest flex items-center justify-center">
              <User className="w-5 h-5 text-tactical-cyan" />
            </div>
            <div>
              <div className="text-xs font-display font-black text-white tracking-wider">
                {tourist.full_name}
              </div>
              <div className="text-[9px] font-mono text-tactical-muted">REGISTERED GUARDIAN XCEL HIKER</div>
            </div>
          </div>
          <BadgeCheck className="w-5 h-5 text-emerald-400" />
        </div>

        {/* UGID Badge */}
        <div className="flex items-center gap-2 p-2 rounded bg-tactical-darkest border border-tactical-cyan/30">
          <QrCode className="w-4 h-4 text-tactical-cyan shrink-0" />
          <div>
            <div className="text-[8px] font-mono text-tactical-muted">UGID (Unique Guardian Identifier)</div>
            <div className="text-sm font-display font-black text-tactical-cyan tracking-widest">
              {tourist.ugid}
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex justify-between py-1 border-b border-tactical-border/30">
            <span className="text-tactical-muted">Full Name:</span>
            <span className="font-bold text-white">{tourist.full_name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-tactical-border/30">
            <span className="text-tactical-muted">Blood Type:</span>
            <span className="font-bold text-rose-300">{tourist.blood_type}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-tactical-border/30">
            <span className="text-tactical-muted">Medical Notes:</span>
            <span className="text-amber-300 font-semibold text-right max-w-[170px]">{tourist.medical_notes}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-tactical-border/30">
            <span className="text-tactical-muted">GPS Position:</span>
            <span className="text-white font-bold">
              {tourist.current_lat.toFixed(4)}°N, {Math.abs(tourist.current_lon).toFixed(4)}°W
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-tactical-border/30">
            <span className="text-tactical-muted">Altitude:</span>
            <span className="text-white font-bold">{tourist.altitude} m ASL</span>
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="p-3 rounded border border-rose-500/40 bg-rose-950/20 space-y-2">
        <div className="text-[9px] font-mono font-bold text-rose-400 uppercase flex items-center gap-1 border-b border-rose-500/30 pb-1.5">
          <Phone className="w-3 h-3" />
          EMERGENCY CONTACT
        </div>
        <div className="text-[10px] font-mono space-y-0.5">
          <div className="text-slate-200 font-bold text-xs">{tourist.emergency_contact}</div>
          <div className="text-tactical-muted text-[9px]">Automatically notified upon emergency detection</div>
        </div>
      </div>

      {/* Security / Encrypted Telemetry */}
      <div className="p-3 rounded border border-tactical-border/80 bg-tactical-card/60 space-y-2">
        <div className="text-[9px] font-mono font-bold text-tactical-muted uppercase flex items-center gap-1 border-b border-tactical-border/50 pb-1.5">
          <Lock className="w-3 h-3 text-tactical-cyan" />
          ENCRYPTION & IDENTITY SECURITY
        </div>
        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-tactical-muted">Telemetry Encryption:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><Key className="w-3 h-3" /> AES-256 ACTIVE</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tactical-muted">UGID Verification:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1"><Fingerprint className="w-3 h-3" /> SHA-256 HASH VERIFIED</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tactical-muted">Backend Auth:</span>
            <span className={`font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'TACTICAL HUB SYNCED' : 'AWAITING CONNECTION'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tactical-muted">Uplink Channel:</span>
            <span className="text-tactical-cyan font-bold">{comms.channel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tactical-muted">Packet Counter:</span>
            <span className="text-slate-300 font-bold">{comms.packet_counter?.toLocaleString() || '--'}</span>
          </div>
        </div>
      </div>

      {/* Device Status */}
      <div className="p-2.5 rounded border border-tactical-border/80 bg-tactical-card/50 text-[10px] font-mono">
        <div className="text-[9px] font-bold text-tactical-muted uppercase mb-1.5">WEARABLE DEVICE STATUS</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Battery', value: `${tourist.battery_pct}%`, ok: tourist.battery_pct > 20 },
            { label: 'GPS Fix', value: 'RTK LOCKED', ok: true },
            { label: 'Heart Rate Sensor', value: `${tourist.heart_rate} BPM`, ok: true },
            { label: 'Accelerometer', value: '3-AXIS LIVE', ok: true },
            { label: 'LoRa Radio', value: '868 MHz STANDBY', ok: true },
            { label: 'Secure Enclave', value: 'ACTIVE', ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.ok ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className="text-tactical-muted truncate">{item.label}:</span>
              <span className={`font-bold ${item.ok ? 'text-slate-200' : 'text-rose-400'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
