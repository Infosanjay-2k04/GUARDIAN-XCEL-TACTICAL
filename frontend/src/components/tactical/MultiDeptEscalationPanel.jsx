import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Shield, HeartPulse, Truck, Lock, CheckCircle2, Radio, Send, FileCode, AlertTriangle, Building2, Droplet, MessageSquare, Zap, Users, Gauge, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function MultiDeptEscalationPanel() {
  const { departmental_dispatches, active_incident, tourist, rescue_team, dispatchRescue } = useSystem();

  const dispatches = departmental_dispatches || {
    police: {
      callsign: 'INTERCEPT-710 // PURSUIT-ALPHA',
      status: 'STANDBY_MONITORING',
      status_label: 'PATROL STANDBY',
      target_coordinates: `${(tourist?.current_lat || 11.3995).toFixed(5)}°N, ${(tourist?.current_lon || 78.1614).toFixed(5)}°E`,
      velocity_vector: 'G-Force: 1.0g | Heading: 042° NE',
      emergency_contact: tourist?.emergency_contact || '+1 (555) 019-2834',
      recipient_station: 'CENTRAL POLICE PRECINCT // SECTOR 4',
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    medical: {
      callsign: 'MEDIC-33 // ADVANCED-LIFE-SUPPORT',
      hospital_recipient: 'MERCY LEVEL-1 TRAUMA CENTER (TRIAGE BAY 02)',
      status: 'STANDBY_MONITORING',
      status_label: 'STANDBY',
      blood_type: tourist?.blood_type || 'O-POS',
      known_allergies: 'Penicillin (Severe Anaphylaxis Risk)',
      ambulance_eta: '--',
      sha256_hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
    },
    sar: {
      callsign: 'TACTICAL SAR // ECHO-4',
      status: 'STANDBY',
      status_label: 'STANDBY',
      terrain_entry_point: 'TRAILHEAD ACCESS GATE BRAVO (GRID 11-78)',
      routing_vector: 'BEARING 042° AZIMUTH // GRADE 4',
      rescue_team_eta: '--',
      sha256_hash: '5b1b68a96d19a4e326b48450f3b438b4df568ff62886f78ee9d4cb7c73228a05'
    }
  };

  const medMatch = departmental_dispatches?.medical_facility || {
    matched_facility_name: 'Mercy Level-1 Regional Trauma Center',
    trauma_tier: 'LEVEL-1 ICU COMPREHENSIVE',
    distance_km: 4.2,
    eta_minutes: 3.5,
    blood_match_confirmed: true,
    target_blood_group: tourist?.blood_type || 'O-POS',
    reserved_units: 14,
    icu_beds_available: 3,
    bed_reservation_code: 'RES-MERCY-914-OPOS'
  };

  const isEmergency = active_incident !== null && active_incident !== undefined;
  
  // Ground Team SAR State Mapping
  const groundStatus = rescue_team?.status || 'STANDBY';
  const isGroundEnRoute = groundStatus === 'EN_ROUTE' || groundStatus === 'DISPATCHED';
  const isGroundOnScene = groundStatus === 'ON_SCENE';
  const isGroundSecured = groundStatus === 'VICTIM_SECURED';

  return (
    <div className="flex flex-col gap-2.5 font-mono text-[10px]">
      {/* Header Banner with Telegram & AES-256 Badge */}
      <div className="bg-tactical-card p-2 rounded border border-tactical-border/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Send className="w-3.5 h-3.5 text-tactical-cyan animate-pulse" />
          <span>MULTI-DEPARTMENT AUTONOMOUS ESCALATION</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/50 text-blue-300 font-bold flex items-center gap-1">
            <MessageSquare className="w-2.5 h-2.5" />
            TELEGRAM CLOUD NOTIFIER
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            AES-256
          </span>
        </div>
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
            <span className="text-white font-bold">{tourist?.ugid || 'GX-8921-ALPHA'}</span>
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

      {/* 2. Medical / Hospital Fast-Track & Blood Bank Matching Card */}
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
            {isEmergency ? 'HOSPITAL ALERTED // BLOOD MATCHED' : 'STANDBY'}
          </span>
        </div>

        <div className="pt-1.5 space-y-1.5 text-slate-300">
          {/* Matched Facility Box */}
          <div className="p-1.5 rounded bg-black/60 border border-rose-500/40 space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-rose-300">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-rose-400" />
                {medMatch.matched_facility_name}
              </span>
              <span className="text-emerald-400 font-bold">{medMatch.trauma_tier}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-tactical-muted">Reservation Code:</span>
              <code className="text-cyan-300 font-bold">{medMatch.bed_reservation_code}</code>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-tactical-muted flex items-center gap-1">
                <Droplet className="w-2.5 h-2.5 text-red-500" />
                Target Blood Group ({medMatch.target_blood_group}):
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1 rounded border border-emerald-500/40">
                {medMatch.reserved_units} UNITS RESERVED
              </span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-tactical-muted">ICU Trauma Beds:</span>
              <span className="text-white font-bold">{medMatch.icu_beds_available} BEDS AVAILABLE</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-tactical-muted">Critical Allergies:</span>
              <span className="text-amber-300 font-semibold">{dispatches.medical.known_allergies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tactical-muted">Ambulance Unit ETA:</span>
              <span className="text-emerald-400 font-bold">{isEmergency ? `${(rescue_team?.eta_minutes || 3.5).toFixed(1)} MINS` : '--'}</span>
            </div>
            <div className="text-[8px] text-slate-400 truncate pt-0.5 border-t border-rose-500/20">
              SHA-256: <code className="text-rose-300">{dispatches.medical.sha256_hash.substring(0, 24)}...</code>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Forest / Ground Tactical SAR Team Card (Interactive Echo-4 Unit) */}
      <div className={`p-2.5 rounded border transition-all ${
        isGroundSecured
          ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(0,255,157,0.25)]'
          : isGroundOnScene
          ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
          : isGroundEnRoute
          ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          : 'bg-tactical-card/70 border-tactical-border/60'
      }`}>
        <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>GROUND SAR TEAM // TACTICAL SAR // ECHO-4</span>
          </div>
          {/* Dynamic Status Badge */}
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
            isGroundSecured
              ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200'
              : isGroundOnScene
              ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 animate-pulse'
              : isGroundEnRoute
              ? 'bg-amber-500/30 border border-amber-400 text-amber-200 animate-pulse'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {isGroundSecured 
              ? 'SECURED // TRIAGE ACTIVE' 
              : isGroundOnScene 
              ? 'ON SCENE // STABILIZING' 
              : isGroundEnRoute 
              ? 'EN ROUTE // APPROACH ACTIVE' 
              : 'OUTPOST STANDBY'}
          </span>
        </div>

        <div className="pt-1.5 space-y-1 text-slate-300">
          {/* Unit Specifications */}
          <div className="grid grid-cols-2 gap-1 bg-black/50 p-1.5 rounded border border-amber-500/20 text-[9px]">
            <div>
              <span className="text-tactical-muted">Vehicle: </span>
              <span className="text-white font-bold">4x4 ALL-TERRAIN RAPID RESPONSE</span>
            </div>
            <div>
              <span className="text-tactical-muted">Crew: </span>
              <span className="text-cyan-300 font-bold">4 SPECIALISTS</span>
            </div>
            <div>
              <span className="text-tactical-muted">Speed: </span>
              <span className="text-amber-300 font-bold">{rescue_team?.speed_kmh || ((rescue_team?.speed_mps || 0) * 3.6).toFixed(1)} KM/H</span>
            </div>
            <div>
              <span className="text-tactical-muted">Distance: </span>
              <span className="text-emerald-400 font-bold">{rescue_team?.distance_to_target_m || 0}m</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-tactical-muted">Trailhead Entry Point:</span>
            <span className="text-white font-bold">{dispatches.sar.terrain_entry_point}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Dynamic Intercept ETA:</span>
            <span className="text-emerald-400 font-bold text-[11px] font-mono">
              {rescue_team?.eta_formatted ? `${rescue_team.eta_formatted} (${rescue_team.eta_seconds}s)` : '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-tactical-muted">Tobler Slope Resistance:</span>
            <span className="text-amber-300 font-semibold">{rescue_team?.tobler_kinematics?.speed_kmh || 28.5} km/h (Slope +{rescue_team?.tobler_kinematics?.slope_deg || 18.4}°)</span>
          </div>

          {/* Action Button: Manual Override Ground Dispatch */}
          <div className="pt-1.5">
            <button
              onClick={() => dispatchRescue(active_incident?.id || 1)}
              disabled={isGroundSecured}
              className={`w-full py-1 px-2 rounded font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 ${
                isGroundSecured
                  ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-300 cursor-not-allowed'
                  : isGroundOnScene
                  ? 'bg-cyan-950/70 border border-cyan-500 text-cyan-300'
                  : isGroundEnRoute
                  ? 'bg-amber-950/80 border border-amber-500 text-amber-300 hover:bg-amber-900/90'
                  : 'bg-amber-500 text-black hover:bg-amber-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              {isGroundSecured
                ? 'VICTIM SECURED // MISSION COMPLETE'
                : isGroundOnScene
                ? 'GROUND TEAM ON SCENE // TRIAGE ACTIVE'
                : isGroundEnRoute
                ? 'FORCE BOOST // RE-ENGAGE INTERCEPT ROUTE'
                : 'MANUAL OVERRIDE: FORCE GROUND DISPATCH'}
            </button>
          </div>

          <div className="text-[8px] text-slate-400 truncate pt-0.5 border-t border-amber-500/20">
            SHA-256: <code className="text-amber-300">{dispatches.sar.sha256_hash.substring(0, 24)}...</code>
          </div>
        </div>
      </div>
    </div>
  );
}
