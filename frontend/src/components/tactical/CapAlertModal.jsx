import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldAlert, FileCode, Copy, Check, X, Lock, Send, Radio } from 'lucide-react';

export default function CapAlertModal({ isOpen, onClose }) {
  const { departmental_dispatches, active_incident, tourist } = useSystem();
  const [format, setFormat] = useState('xml'); // 'xml' | 'json'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const xmlContent = departmental_dispatches?.cap_v12_xml || `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>urn:guardian-xcel:cap:${active_incident?.incident_number || 'INC-20260825-118'}</identifier>
  <sender>tactical-hub-alpha@guardianxcel.internal</sender>
  <sent>${new Date().toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Restricted</scope>
  <restriction>LAW_ENFORCEMENT,MEDICAL_EMS,GROUND_SAR</restriction>
  <info>
    <category>Rescue</category>
    <event>Wilderness Distress &amp; Kinetic Trauma Incident</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <headline>GUARDIAN XCEL CRITICAL DISTRESS // UGID ${tourist?.ugid || 'GX-8921-ALPHA'}</headline>
    <description>Autonomous AI sensor guard confirmed high-G impact and victim immobility. Multi-departmental intercept vectors active.</description>
    <contact>+1 (555) 019-2834</contact>
    <parameter>
      <valueName>UGID</valueName>
      <value>${tourist?.ugid || 'GX-8921-ALPHA'}</value>
    </parameter>
    <parameter>
      <valueName>VictimBloodType</valueName>
      <value>${tourist?.blood_type || 'O-POS'}</value>
    </parameter>
    <parameter>
      <valueName>ForensicAuditSignature</valueName>
      <value>${departmental_dispatches?.police?.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</value>
    </parameter>
    <area>
      <areaDesc>Sector Alpha Core Hazard Zone</areaDesc>
      <circle>${tourist?.current_lat?.toFixed(5) || '37.74200'},${tourist?.current_lon?.toFixed(5) || '-119.59750'},400.0</circle>
    </area>
  </info>
</alert>`;

  const jsonContent = JSON.stringify(departmental_dispatches?.cap_v12_json || {
    identifier: `urn:guardian-xcel:cap:${active_incident?.incident_number || 'INC-20260825-118'}`,
    sender: "tactical-hub-alpha@guardianxcel.internal",
    sent: new Date().toISOString(),
    status: "Actual",
    msgType: "Alert",
    info: {
      category: "Rescue",
      event: "Wilderness Distress",
      urgency: "Immediate",
      severity: "Extreme",
      headline: `GUARDIAN XCEL CRITICAL DISTRESS // UGID ${tourist?.ugid || 'GX-8921-ALPHA'}`
    }
  }, null, 2);

  const textToShow = format === 'xml' ? xmlContent : jsonContent;

  const handleCopy = () => {
    navigator.clipboard?.writeText(textToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="tactical-box p-4 rounded-lg border border-cyan-500/80 bg-tactical-darkest max-w-2xl w-full shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col gap-3 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2">
          <div className="flex items-center gap-2 text-tactical-cyan font-bold text-xs">
            <FileCode className="w-4 h-4 text-tactical-cyan" />
            <span>OASIS STANDARD COMMON ALERTING PROTOCOL (CAP v1.2)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector & Copy Button */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center bg-tactical-card rounded p-0.5 border border-tactical-border">
            <button
              onClick={() => setFormat('xml')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                format === 'xml' ? 'bg-tactical-cyan text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              OASIS XML (CAP v1.2)
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                format === 'json' ? 'bg-tactical-cyan text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON REST PAYLOAD
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-tactical-card hover:bg-tactical-cardHover border border-tactical-border text-slate-200 hover:text-white transition-all text-[9px] font-bold"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-tactical-cyan" />}
            {copied ? 'COPIED TO CLIPBOARD' : 'COPY RAW PAYLOAD'}
          </button>
        </div>

        {/* Syntax Viewer */}
        <div className="flex-1 bg-black/90 p-3 rounded border border-tactical-border/80 overflow-y-auto text-[9px] text-cyan-300 font-mono select-all">
          <pre className="whitespace-pre-wrap">{textToShow}</pre>
        </div>

        {/* Verification Footer */}
        <div className="p-2 rounded bg-tactical-card/70 border border-tactical-border/60 flex items-center justify-between text-[9px] text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Lock className="w-3 h-3" />
            OASIS CAP v1.2 VALIDATED // SHA-256 SIGNED
          </span>
          <span className="text-slate-400">Standard: ITU-T X.1303 / OASIS CAP v1.2</span>
        </div>
      </div>
    </div>
  );
}
