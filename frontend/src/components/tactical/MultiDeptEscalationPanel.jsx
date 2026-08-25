import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Shield, HeartPulse, Truck, Lock, CheckCircle2, Radio, Send, FileCode, AlertTriangle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function MultiDeptEscalationPanel() {
  const { departmental_dispatches, active_incident, tourist, rescue_team } = useSystem();

  const dispatches = departmental_dispatches || {
    police: {
      callsign: 'INTERCEPT-710 // PURSUIT-ALPHA',
      status: 'STANDBY_MONITORING',
      status_label: 'PATROL STANDBY',
      target_coordinates: `${tourist.current_lat.toFixed(5)}°N, ${Math.abs(tourist.current_lon).toFixed(5)}°W`,
      velocity_vector: 'G-Force: 1.0g | Heading: 214° SW',
      emergency_contact: tourist.emergency_contact,
      recipient_station: 'CENTRAL POLICE PRECINCT // SECTOR 4',
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    medical: {
      callsign: 'MEDIC-33 // ADVANCED-LIFE-SUPPORT',
      hospital_recipient: 'MERCY LEVEL-1 TRAUMA CENTER (TRIAGE BAY 02)',
      status: 'STANDBY_MONITORING',
      status_label: 'STANDBY',
      blood_type: tourist.blood_type || 'O-POS',
      known_allergies: 'Penicillin (Severe Anaphylaxis Risk)',
      ambulance_eta: '--',
      sha256_hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
    },
    sar: {
      callsign: 'TACTICAL ALL-TERRAIN UNIT ECHO-4',
      status: 'OUTPOST_STANDBY',
      status_label: 'OUTPOST STANDBY',
      terrain_entry_point: 'TRAILHEAD ACCESS GATE BRAVO (GRID 37-119)',
      routing_vector: 'BEARING 214° AZIMUTH // GRADE 4',
      rescue_team_eta: '--',
      sha256_hash: '5b1b68a96d19a4e326b48450f3b438b4df568ff62886f78ee9d4cb7c73228a05'
    }
  };

  const isEmergency = active_incident !== null && active_incident !== undefined;

  return (
    <div className="flex flex-col gap-2.5 font-mono text-[10px]">
      {/* Header Banner */}
      <div className="bg-tactical-card p-2 rounded border border-tactical-border/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Send className="w-3.5 h-3.5 text-tactical-cyan animate-pulse" />
          <span>MULTI-DEPARTMENT AUTONOMOUS ESCALATION</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" />
          AES-256 ENCRYPTED
        </span>
      </div>

      {/* 1. Police Department Intercept Card */}
      <div className={`p-2.5 rounded border transition-all ${
        isEmergency
          ? 'bg-blue-950/40 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
          : 'bg-tactical-card/70 border-tactical-border/60'
      }`}>
        <div className="flex items-center justify-between pb-1.5 border-b border-blue-500/30">
          <div className="flex items-center gap-1.5 font-bold text-blue-300">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>POLICE INTERCEPT // {dispatches.police.callsign}</span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
            isEmergency 
              ? 'bg-blue-500/30 border border-blue-400 text-blue-200 animate-pulse' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isEmergency ? 'DISPATCHED // PURSUIT VECTOR ACTIVE' : 'PATROL STANDBY'}
          </span>
        </div>

        <div className="pt-1.5 space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-tactical-muted">Target UGID:</span>
            <span className="text-white font-bold">{tourist.ugid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Live Intercept GPS:</span>
            <span className="text-cyan-300 font-bold">{dispatches.police.target_coordinates}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Velocity Vector:</span>
            <span className="text-amber-300">{dispatches.police.velocity_vector}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Emergency Contact:</span>
            <span className="text-slate-200">{dispatches.police.emergency_contact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Station Dispatch Ack:</span>
            <span className="text-blue-300 font-semibold">{dispatches.police.recipient_station}</span>
          </div>
          <div className="text-[8px] text-slate-400 truncate pt-0.5 border-t border-blue-500/20">
            SHA-256: <code className="text-blue-300">{dispatches.police.sha256_hash.substring(0, 24)}...</code>
          </div>
        </div>
      </div>

      {/* 2. Medical / Hospital Fast-Track Card */}
      <div className={`p-2.5 rounded border transition-all ${
        isEmergency
          ? 'bg-rose-950/40 border-rose-500/80 shadow-[0_0_15px_rgba(255,34,85,0.25)]'
          : 'bg-tactical-card/70 border-tactical-border/60'
      }`}>
        <div className="flex items-center justify-between pb-1.5 border-b border-rose-500/30">
          <div className="flex items-center gap-1.5 font-bold text-rose-300">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>MEDICAL FAST-TRACK // {dispatches.medical.callsign}</span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
            isEmergency 
              ? 'bg-rose-500/30 border border-rose-400 text-rose-200 animate-pulse' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isEmergency ? 'HOSPITAL ALERTED // BLOOD ATTACHED' : 'STANDBY'}
          </span>
        </div>

        <div className="pt-1.5 space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-tactical-muted">Hospital Recipient:</span>
            <span className="text-white font-bold">{dispatches.medical.hospital_recipient}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Blood Group (Vault):</span>
            <span className="text-rose-400 font-bold bg-rose-950/80 px-1 rounded border border-rose-500/50">
              {dispatches.medical.blood_type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Critical Allergies:</span>
            <span className="text-amber-300 font-semibold">{dispatches.medical.known_allergies}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Ambulance Unit ETA:</span>
            <span className="text-emerald-400 font-bold">{isEmergency ? `${rescue_team.eta_minutes.toFixed(1)} MINS` : '--'}</span>
          </div>
          <div className="text-[8px] text-slate-400 truncate pt-0.5 border-t border-rose-500/20">
            SHA-256: <code className="text-rose-300">{dispatches.medical.sha256_hash.substring(0, 24)}...</code>
          </div>
        </div>
      </div>

      {/* 3. Forest / Ground SAR Team Card */}
      <div className={`p-2.5 rounded border transition-all ${
        isEmergency
          ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          : 'bg-tactical-card/70 border-tactical-border/60'
      }`}>
        <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>GROUND SAR TEAM // {dispatches.sar.callsign}</span>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
            isEmergency 
              ? 'bg-amber-500/30 border border-amber-400 text-amber-200 animate-pulse' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isEmergency ? 'ECHO-4 DISPATCHED // OFF-ROAD ACTIVE' : 'OUTPOST STANDBY'}
          </span>
        </div>

        <div className="pt-1.5 space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-tactical-muted">Trailhead Entry Point:</span>
            <span className="text-white font-bold">{dispatches.sar.terrain_entry_point}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Target Altitude ASL:</span>
            <span className="text-cyan-300 font-bold">{dispatches.sar.altitude_asl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Off-Road Route Azimuth:</span>
            <span className="text-amber-300 font-semibold">{dispatches.sar.routing_vector}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Echo-4 Unit ETA:</span>
            <span className="text-emerald-400 font-bold">{isEmergency ? `${rescue_team.eta_minutes.toFixed(1)} MINS` : '--'}</span>
          </div>
          <div className="text-[8px] text-slate-400 truncate pt-0.5 border-t border-amber-500/20">
            SHA-256: <code className="text-amber-300">{dispatches.sar.sha256_hash.substring(0, 24)}...</code>
          </div>
        </div>
      </div>
    </div>
  );
}
