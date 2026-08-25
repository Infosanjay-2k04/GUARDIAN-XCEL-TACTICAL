import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Shield, Battery, Radio, QrCode,
  Compass, User, Flame, ShieldAlert,
  Wifi, WifiOff
} from 'lucide-react';

import HomeScreen from './HomeScreen';
import ExploreScreen from './ExploreScreen';
import SafetyScreen from './SafetyScreen';
import ProfileScreen from './ProfileScreen';
import EmergencyOverlay from './EmergencyOverlay';
import SimControls from './SimControls';
import StatusBadge from '../common/StatusBadge';

const NAV_TABS = [
  { id: 'home',    label: 'HOME',    Icon: Shield },
  { id: 'explore', label: 'EXPLORE', Icon: Compass },
  { id: 'safety',  label: 'SAFETY',  Icon: ShieldAlert },
  { id: 'profile', label: 'PROFILE', Icon: User }
];

export default function MobileView({ embedded = false }) {
  const { tourist, comms, active_incident, isConnected, triggerSim, sendLiveSensorData } = useSystem();
  const [activeTab, setActiveTab] = useState('home');
  const [realSensorActive, setRealSensorActive] = useState(false);
  const lastMotionSendRef = React.useRef(0);

  // Auto-focus home / emergency screen when incident becomes active
  useEffect(() => {
    if (active_incident) {
      setActiveTab('home');
    }
  }, [!!active_incident]);

  // 1. Stream Real Phone GPS via navigator.geolocation.watchPosition
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        if (sendLiveSensorData) {
          sendLiveSensorData({
            lat: latitude,
            lon: longitude,
            accuracy: accuracy || 5.0,
            altitude: altitude || 1240.0
          });
        }
      },
      (err) => {
        // Fallback gracefully on desktop or if denied
        console.warn('[GPS Stream] Geolocation notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [sendLiveSensorData]);

  // 2. Stream Real Phone Accelerometer via window.DeviceMotionEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeviceMotion = (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 9.8;

      // Compute G-force magnitude
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      const gForce = mag / 9.80665; // Normalize standard gravity to 1.0g

      const now = Date.now();
      // Throttle to 5Hz (every 200ms)
      if (now - lastMotionSendRef.current >= 200) {
        lastMotionSendRef.current = now;
        setRealSensorActive(true);
        if (sendLiveSensorData) {
          sendLiveSensorData({
            accel_x: parseFloat(ax.toFixed(3)),
            accel_y: parseFloat(ay.toFixed(3)),
            accel_z: parseFloat(az.toFixed(3)),
            g_force: parseFloat(gForce.toFixed(2))
          });
        }
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [sendLiveSensorData]);

  const isCritical = tourist.threat_level === 'CRITICAL';
  const isWarning  = tourist.threat_level === 'WARNING';
  const isLoRa     = comms.channel === 'LORA_MESH';

  return (
    <div className={`flex justify-center items-start ${embedded ? 'w-full h-full' : 'min-h-[calc(100vh-4rem)] p-3 sm:p-6'}`}>

      {/* ═══════════════ PHONE FRAME ═══════════════ */}
      <div className={`
        w-full flex flex-col overflow-hidden relative
        ${embedded
          ? 'h-full rounded-none border border-tactical-border/50 bg-tactical-darkest/98'
          : 'max-w-[390px] min-h-[820px] rounded-2xl border shadow-2xl bg-tactical-darkest/98'
        }
        ${isCritical
          ? 'border-rose-500/80 shadow-[0_0_30px_rgba(255,34,85,0.3)]'
          : 'border-tactical-border/80'
        }
      `}>

        {/* CRT scanline texture */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-25"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 3px)' }}
        />

        {/* ─── TOP STATUS BAR ─── */}
        <div className="relative z-10 bg-tactical-dark/95 border-b border-tactical-border px-3 py-2 flex items-center justify-between text-[11px] font-mono select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-tactical-cyan" />
            <span className="font-display font-black text-white tracking-wider text-xs">
              GUARDIAN <span className="text-tactical-cyan">XCEL</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-0.5 ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            </span>
            <span className={`flex items-center gap-1 ${isLoRa ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-300'}`}>
              <Radio className="w-3 h-3" />
              {isLoRa ? 'LoRa' : '4G'}
            </span>
            <span className={`flex items-center gap-1 ${tourist.battery_pct < 20 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
              <Battery className="w-3.5 h-3.5" />
              {tourist.battery_pct}%
            </span>
          </div>
        </div>

        {/* ─── UGID + STATUS PILL ─── */}
        <div className="relative z-10 bg-tactical-card/80 border-b border-tactical-border/60 px-3 py-1.5 flex items-center justify-between text-[10px] font-mono shrink-0">
          <div className="flex items-center gap-1 text-slate-300">
            <QrCode className="w-3 h-3 text-tactical-cyan" />
            <span className="text-tactical-muted">UGID:</span>
            <span className="font-bold text-tactical-cyan">{tourist.ugid}</span>
          </div>
          {active_incident ? (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              EMERGENCY ACTIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {realSensorActive ? 'PHONE SENSORS LIVE' : 'AUTO-LOCATION ACTIVE'}
            </span>
          )}
        </div>

        {/* ─── EMERGENCY ALERT BANNER ─── */}
        {active_incident && (
          <div className="relative z-10 bg-rose-950/70 border-b border-rose-500/80 px-3 py-2 flex items-center justify-between shadow-[0_0_20px_rgba(255,34,85,0.3)] shrink-0">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400 animate-bounce shrink-0" />
              <div>
                <div className="text-xs font-mono font-black text-rose-300 tracking-wider leading-tight">
                  EMERGENCY — {active_incident.incident_number}
                </div>
                <div className="text-[9px] font-mono text-rose-400/80">
                  {active_incident.trigger_type} detected — Rescue activated
                </div>
              </div>
            </div>
            <StatusBadge status={active_incident.status} size="xs" pulse />
          </div>
        )}

        {/* ─── MAIN CONTENT AREA ─── */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 z-10 min-h-0">
          {/* Emergency screen takes over HOME tab */}
          {active_incident && activeTab === 'home' ? (
            <div className="flex flex-col gap-3">
              <EmergencyOverlay />
              <SimControls />
            </div>
          ) : (
            <>
              {activeTab === 'home'    && <HomeScreen />}
              {activeTab === 'explore' && <ExploreScreen />}
              {activeTab === 'safety'  && <SafetyScreen />}
              {activeTab === 'profile' && <ProfileScreen />}
            </>
          )}
        </div>

        {/* ─── SOS PANIC BUTTON ─── */}
        <div className="relative z-10 px-3 pt-2 pb-1 shrink-0">
          {!active_incident ? (
            <button
              onClick={() => triggerSim('SOS')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-mono font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-[0_0_20px_rgba(255,34,85,0.45)] border border-rose-400/70"
            >
              <Flame className="w-5 h-5 fill-current" />
              ⚠ BROADCAST MANUAL SOS
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-950/80 border border-rose-500/70 text-rose-300 font-mono font-bold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              SOS ACTIVE — RESCUE IN PROGRESS
            </div>
          )}
        </div>

        {/* ─── SIM CONTROLS (visible when no emergency) ─── */}
        {!active_incident && (
          <div className="relative z-10 px-3 pb-2 shrink-0">
            <SimControls />
          </div>
        )}

        {/* ─── BOTTOM NAVIGATION ─── */}
        <div className="relative z-10 bg-tactical-dark border-t border-tactical-border px-2 py-1.5 grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-center select-none shrink-0">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            const showDot = id === 'home' && active_incident;
            const safetyAlert = id === 'safety' && (isCritical || isWarning);
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`p-1.5 rounded flex flex-col items-center gap-0.5 transition-all relative ${
                  isActive
                    ? 'text-tactical-cyan bg-tactical-card/80'
                    : safetyAlert
                    ? 'text-rose-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {showDot && (
                  <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
