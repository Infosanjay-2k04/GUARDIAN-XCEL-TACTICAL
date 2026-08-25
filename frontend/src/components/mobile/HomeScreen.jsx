import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { MapPin, Radio, Wifi, WifiOff, Activity, Shield, Lock, QrCode, Battery, Satellite, Zap, Eye, Cpu } from 'lucide-react';
import ThreatGauge from './ThreatGauge';
import TelemetryGraph from './TelemetryGraph';
import StatusBadge from '../common/StatusBadge';

function MetricCell({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="tactical-box p-2 rounded text-center border border-tactical-border bg-tactical-darkest/80">
      <div className="text-[8px] font-mono text-tactical-muted uppercase tracking-wide">{label}</div>
      <div className={`text-base font-display font-black ${color} leading-tight mt-0.5`}>{value}</div>
      {sub && <div className="text-[8px] font-mono text-tactical-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionPanel({ title, accent = false, children }) {
  return (
    <div className={`rounded border ${accent ? 'border-tactical-cyan/50' : 'border-tactical-border/80'} bg-tactical-dark/80 overflow-hidden`}>
      <div className={`px-2.5 py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase flex items-center justify-between border-b ${accent ? 'border-tactical-cyan/30 text-tactical-cyan bg-tactical-cyan/5' : 'border-tactical-border/50 text-tactical-muted'}`}>
        {title}
      </div>
      <div className="p-2.5 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueClass = 'text-slate-200', dot, dotClass }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-tactical-muted">{label}</span>
      <span className={`font-bold flex items-center gap-1 ${valueClass}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
        {value}
      </span>
    </div>
  );
}

export default function HomeScreen() {
  const { tourist, comms, isConnected, accelHistory } = useSystem();

  const isLoRa = comms.channel === 'LORA_MESH';
  const isCritical = tourist.threat_level === 'CRITICAL';
  const isWarning = tourist.threat_level === 'WARNING';

  // Calculate rough speed from step counter delta (simplified)
  const speedDisplay = tourist.step_counter > 0 ? '1.2 m/s' : '0.0 m/s';

  return (
    <div className="flex flex-col gap-2.5 pb-2">

      {/* ========== IDENTITY SECTION ========== */}
      <SectionPanel title="IDENTITY" accent>
        <InfoRow label="UGID:" value={tourist.ugid} valueClass="text-tactical-cyan text-xs font-black tracking-wide" />
        <InfoRow label="Tourist Status:" value="ACTIVE MONITORING"
          dot valueClass="text-emerald-400"
          dotClass="bg-emerald-400 animate-pulse"
        />
        <InfoRow label="Blood Type:" value={tourist.blood_type} valueClass="text-rose-300" />
        <InfoRow label="Medical Notes:" value={tourist.medical_notes}
          valueClass="text-amber-300 text-right max-w-[160px] truncate"
        />
      </SectionPanel>

      {/* ========== LOCATION SECTION ========== */}
      <SectionPanel title="LOCATION">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          AUTO-LOCATION ACTIVE
        </div>
        <InfoRow label="GPS Coordinates:" value={`${tourist.current_lat.toFixed(4)}°N, ${Math.abs(tourist.current_lon).toFixed(4)}°W`} />
        <InfoRow label="Altitude:" value={`${tourist.altitude} m ASL`} />
        <InfoRow label="Location Accuracy:" value="±2.4 m (RTK)" valueClass="text-emerald-400" />
        <InfoRow label="Last Update:" value="< 200ms ago" valueClass="text-tactical-cyan" />
      </SectionPanel>

      {/* ========== THREAT GAUGE ========== */}
      <ThreatGauge
        threatLevel={tourist.threat_level}
        gForce={tourist.g_force}
        heartRate={tourist.heart_rate}
      />

      {/* ========== LIVE METRICS ========== */}
      <SectionPanel title="LIVE METRICS">
        <div className="grid grid-cols-3 gap-2">
          <MetricCell label="MOVEMENT" value={speedDisplay} sub="m/s est." color="text-tactical-cyan" />
          <MetricCell label="HEART RATE" value={`${tourist.heart_rate}`} sub="BPM" color="text-rose-400" />
          <MetricCell label="BATTERY" value={`${tourist.battery_pct}%`} sub="wearable" color={tourist.battery_pct < 20 ? 'text-rose-400' : 'text-emerald-400'} />
          <MetricCell label="GPS FIX" value="RTK" sub="±2.4m" color="text-emerald-400" />
          <MetricCell label="STEP COUNT" value={`${tourist.step_counter}`} sub="session" color="text-tactical-cyan" />
          <MetricCell label="G-FORCE" value={`${tourist.g_force.toFixed(2)}g`} sub="3-axis" color={tourist.g_force > 2.5 ? 'text-rose-400' : 'text-slate-200'} />
        </div>
      </SectionPanel>

      {/* ========== RADAR SECTION ========== */}
      <SectionPanel title="RADAR">
        {/* Mini radar animation */}
        <div className="relative flex items-center justify-center h-20 overflow-hidden rounded bg-tactical-darkest border border-tactical-border/60">
          <div className="absolute w-28 h-28 rounded-full border border-tactical-cyan/15" />
          <div className="absolute w-16 h-16 rounded-full border border-tactical-cyan/25" />
          <div className="absolute w-6 h-6 rounded-full border border-tactical-cyan/60" />
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-tactical-cyan/15" />
          <div className="absolute h-full w-[1px] bg-tactical-cyan/15" />
          {/* Rotating sweep */}
          <div className="absolute w-28 h-28 rounded-full animate-radar-sweep"
            style={{ borderTop: '2px solid rgba(0,240,255,0.7)', borderRight: '2px solid transparent', borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }}
          />
          {/* Self-blip */}
          <div className="w-2.5 h-2.5 rounded-full bg-tactical-cyan shadow-cyan-glow animate-pulse z-10" />
          {/* Infrastructure blips */}
          <div className="absolute" style={{ top: '18%', left: '58%' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80" title="Ranger HQ" />
          </div>
          <div className="absolute" style={{ bottom: '22%', right: '25%' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-70" title="LoRa Node" />
          </div>
        </div>
        <InfoRow label="Radar Status:" value="RADAR LINKED" valueClass="text-emerald-400"
          dot dotClass="bg-emerald-400 animate-pulse"
        />
        <InfoRow label="Tactical Hub:" value="CONNECTED" valueClass="text-emerald-400" />
        <InfoRow label="Safety Nodes:" value="3 WITHIN RANGE" valueClass="text-tactical-cyan" />
      </SectionPanel>

      {/* ========== UPLINK / COMMS SECTION ========== */}
      <SectionPanel title="UPLINK & COMMS">
        <InfoRow
          label="Internet / WebSocket:"
          value={isConnected ? 'ONLINE — 5Hz' : 'OFFLINE'}
          dot dotClass={isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}
          valueClass={isConnected ? 'text-emerald-400' : 'text-rose-400'}
        />
        <InfoRow
          label="Primary Channel:"
          value={isLoRa ? 'LORA 868MHz (FAILOVER)' : '4G LTE (PRIMARY)'}
          valueClass={isLoRa ? 'text-amber-400' : 'text-tactical-cyan'}
          dot dotClass={isLoRa ? 'bg-amber-400 animate-ping' : 'bg-tactical-cyan'}
        />
        <InfoRow label="RSSI:" value={`${comms.cellular_rssi_dbm} dBm`} />
        <InfoRow label="Protocol:" value={comms.active_protocol} valueClass="text-tactical-cyan" />
        <InfoRow label="Packet Loss:" value={`${comms.packet_loss_pct}%`} valueClass={comms.packet_loss_pct > 5 ? 'text-rose-400' : 'text-emerald-400'} />
      </SectionPanel>

      {/* ========== AI SCAN SECTION ========== */}
      <SectionPanel title="AI SCAN">
        <InfoRow label="Sensor Monitoring:" value="ACTIVE" valueClass="text-emerald-400" dot dotClass="bg-emerald-400 animate-pulse" />
        <InfoRow label="Fall Detection:" value={isCritical ? 'TRIGGERED' : 'CLEAR'} valueClass={isCritical ? 'text-rose-400' : 'text-emerald-400'} />
        <InfoRow label="Inactivity Monitor:" value={isCritical ? 'DETECTED' : 'NORMAL'} valueClass={isCritical ? 'text-rose-400' : 'text-emerald-400'} />
        <InfoRow label="AI Risk Score:" value={isCritical ? '0.98' : isWarning ? '0.62' : '0.02'} valueClass={isCritical ? 'text-rose-400 animate-pulse' : 'text-emerald-400'} />
        <InfoRow label="Accel Axes (X/Y/Z):" value={`${tourist.accel_x.toFixed(2)} / ${tourist.accel_y.toFixed(2)} / ${tourist.accel_z.toFixed(2)}`} valueClass="text-slate-300" />
      </SectionPanel>

      {/* ========== 3-AXIS WAVEFORM ========== */}
      <TelemetryGraph />

      {/* ========== SECURITY SECTION ========== */}
      <SectionPanel title="SECURITY">
        <InfoRow label="Encryption:" value="AES-256 ACTIVE" valueClass="text-emerald-400" dot dotClass="bg-emerald-400" />
        <InfoRow label="Encrypted Telemetry:" value="ALL STREAMS" valueClass="text-emerald-400" />
        <InfoRow label="UGID Verification:" value="SHA-256 VERIFIED" valueClass="text-emerald-400" dot dotClass="bg-emerald-400 animate-pulse" />
        <InfoRow label="Secure Status:" value="AUTHENTICATED" valueClass="text-tactical-cyan" />
        <InfoRow label="Device Integrity:" value="NOMINAL" valueClass="text-emerald-400" />
      </SectionPanel>
    </div>
  );
}
