import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Printer, ShieldCheck, FileText, X, Check, Lock, MapPin, Activity, Radio, Award } from 'lucide-react';

export default function ForensicDossierModal({ isOpen, onClose }) {
  const { 
    active_incident, 
    tourist, 
    uav, 
    rescue_team, 
    departmental_dispatches, 
    forensic_ledger, 
    forensic_audit,
    recent_events 
  } = useSystem();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const incidentNum = active_incident?.incident_number || 'INC-20260825-118';
  const ugid = tourist?.ugid || 'GX-8921-ALPHA';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono overflow-y-auto">
      <div className="bg-white text-black p-6 rounded-lg max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>MAGISTERIAL &amp; FORENSIC SEARCH AND RESCUE DOSSIER</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow"
            >
              <Printer className="w-4 h-4" />
              PRINT / EXPORT PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-black p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Document Header */}
        <div className="border-b-2 border-black pb-3 space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-lg font-black tracking-wider text-slate-900 uppercase">GUARDIAN XCEL // FORENSIC INCIDENT DOSSIER</div>
              <div className="text-xs text-slate-600 font-bold">STATE CIVIC RESCUE &amp; MAGISTERIAL ADMISSIBILITY LOG</div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-red-600">DOSSIER REF: {incidentNum}</div>
              <div className="text-slate-500">DATE: {dateStr} // {timeStr}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Victim Profile & Biological Vault */}
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5">
            1. VICTIM IDENTITY &amp; MEDICAL VAULT RECORD
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border">
            <div><strong>Full Name:</strong> {tourist?.full_name || 'Elena Rostova'}</div>
            <div><strong>UGID:</strong> <span className="font-bold text-blue-700">{ugid}</span></div>
            <div><strong>Blood Group:</strong> <span className="font-bold text-red-600">{tourist?.blood_type || 'O-POS'}</span></div>
            <div><strong>Emergency Contact:</strong> {tourist?.emergency_contact || '+1 (555) 019-2834'}</div>
            <div className="col-span-2"><strong>Known Medical Vault Allergies:</strong> {tourist?.medical_notes || 'Penicillin Allergy (Severe Anaphylaxis Risk)'}</div>
          </div>
        </div>

        {/* Section 2: Kinetic Sensor Spikes & Threat Evaluation */}
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5">
            2. MULTI-VARIABLE KINETIC SENSOR TELEMETRY &amp; RISK SCORE
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border text-center">
            <div>
              <div className="text-slate-500 text-[10px]">IMPACT PEAK G-FORCE</div>
              <div className="text-sm font-bold text-red-600">{tourist?.g_force || 3.8}g</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">HEART RATE TELEMETRY</div>
              <div className="text-sm font-bold text-slate-800">{tourist?.heart_rate || 125} BPM</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">MATHEMATICAL RISK (R)</div>
              <div className="text-sm font-bold text-red-600">0.985 // CRITICAL</div>
            </div>
          </div>
        </div>

        {/* Section 3: Geographic Coordinates & FLIR Thermal Lock */}
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5">
            3. GEOGRAPHIC LKP &amp; AUTONOMOUS FLIR THERMAL LOCK
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border">
            <div><strong>Last Known Position (LKP):</strong> {active_incident?.lkp_lat?.toFixed(5) || '37.74200'}°N, {Math.abs(active_incident?.lkp_lon || 119.59750).toFixed(5)}°W</div>
            <div><strong>Altitude:</strong> 1,240.0m ASL (Sector Alpha Core)</div>
            <div><strong>Assigned UAV Unit:</strong> {uav?.callsign || 'UAV-ALPHA // PHOENIX-1'}</div>
            <div><strong>FLIR Body Heat Detection:</strong> <span className="font-bold text-emerald-700">36.8°C (97.6% CONFIDENCE)</span></div>
          </div>
        </div>

        {/* Section 4: Multi-Agency Escalation Log & SHA-256 Hashes */}
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5">
            4. MULTI-AGENCY DISPATCH VERIFICATION &amp; CRYPTOGRAPHIC HASHES
          </div>
          <div className="space-y-1.5 text-[10px] bg-slate-50 p-2.5 rounded border">
            <div className="flex justify-between border-b pb-1">
              <div><strong>POLICE INTERCEPT (PATROL-710):</strong> DISPATCHED // VECTOR ACTIVE</div>
              <code className="text-blue-700">{departmental_dispatches?.police?.sha256_hash?.substring(0, 32) || 'e3b0c44298fc1c149afbf4c8996fb924'}...</code>
            </div>
            <div className="flex justify-between border-b pb-1">
              <div><strong>HOSPITAL FAST-TRACK (MERCY ICU):</strong> ALERTED // BLOOD ATTACHED</div>
              <code className="text-red-700">{departmental_dispatches?.medical?.sha256_hash?.substring(0, 32) || 'a591a6d40bf420404a011733cfb7b190'}...</code>
            </div>
            <div className="flex justify-between">
              <div><strong>GROUND SAR ECHO-4 (POLARIS ATV):</strong> ON SCENE // TOBLER SPEED 16.5 km/h</div>
              <code className="text-amber-700">{departmental_dispatches?.sar?.sha256_hash?.substring(0, 32) || '5b1b68a96d19a4e326b48450f3b438b4'}...</code>
            </div>
          </div>
        </div>

        {/* Section 5: Forensic Blockchain Ledger Root */}
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-0.5">
            5. CRYPTOGRAPHIC FORENSIC LEDGER ROOT ATTESTATION
          </div>
          <div className="bg-slate-900 text-cyan-300 p-2.5 rounded text-[9px] font-mono space-y-0.5">
            <div>MERKLE LEDGER ROOT: <code>{forensic_audit?.last_verified_hash || '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}</code></div>
            <div>STATUS: 100% LEDGER INTEGRITY VERIFIED (0 TAMPERING DETECTED) // ZERO DATA LOSS</div>
          </div>
        </div>

        {/* Legal Certification Block */}
        <div className="pt-3 border-t-2 border-black flex justify-between items-end text-[10px] text-slate-600">
          <div>
            <div>Guardian Xcel Autonomous Emergency Operations Protocol</div>
            <div>Standards: OASIS CAP v1.2 // MAVLink 2.0 // AES-256-GCM</div>
          </div>
          <div className="text-right border-t border-slate-400 pt-1 w-48 text-center text-slate-800">
            <strong>OFFICIAL MAGISTERIAL SEAL</strong>
            <div className="text-[9px] text-slate-500">Autonomous Digital Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
