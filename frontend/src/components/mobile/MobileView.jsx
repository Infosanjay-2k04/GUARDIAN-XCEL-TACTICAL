import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Shield, Battery, Radio, QrCode,
  Compass, User, Flame, ShieldAlert,
  Wifi, WifiOff, Zap, MapPin, AlertTriangle, Check
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
  const [realGpsActive, setRealGpsActive] = useState(false);
  const [realMotionActive, setRealMotionActive] = useState(false);
  const [realBatteryActive, setRealBatteryActive] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [showGpsOverride, setShowGpsOverride] = useState(false);
  const [manualLat, setManualLat] = useState(tourist.current_lat || 37.7420);
  const [manualLon, setManualLon] = useState(tourist.current_lon || -119.5975);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);

  const lastMotionSendRef = useRef(0);
  const highGSpikeCountRef = useRef(0);

  // Auto-focus home / emergency screen when incident becomes active
  useEffect(() => {
    if (active_incident) {
      setActiveTab('home');
    }
  }, [!!active_incident]);

  // 1. Real Device GPS Stream via navigator.geolocation.watchPosition
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('GPS Geolocation API not supported on this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        setRealGpsActive(true);
        setGpsError(null);

        if (sendLiveSensorData) {
          sendLiveSensorData({
            lat: latitude,
            lon: longitude,
            accuracy: accuracy ? parseFloat(accuracy.toFixed(1)) : 2.5,
            altitude: altitude ? parseFloat(altitude.toFixed(1)) : 1240.0
          });
        }
      },
      (err) => {
        console.warn('[GPS Geolocation] Notice:', err.message);
        setRealGpsActive(false);
        setGpsError(err.code === 1 ? 'Location permission denied' : 'GPS acquiring signal...');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [sendLiveSensorData]);

  // 2. Real Device Battery Status via navigator.getBattery()
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getBattery) return;

    let batteryInstance = null;

    const handleBatteryUpdate = () => {
      if (!batteryInstance) return;
      const levelPct = Math.round(batteryInstance.level * 100);
      const chargingState = batteryInstance.charging;

      setRealBatteryActive(true);
      setIsCharging(chargingState);

      if (sendLiveSensorData) {
        sendLiveSensorData({
          battery_pct: levelPct,
          charging: chargingState
        });
      }
    };

    navigator.getBattery().then((battery) => {
      batteryInstance = battery;
      handleBatteryUpdate();
      battery.addEventListener('levelchange', handleBatteryUpdate);
      battery.addEventListener('chargingchange', handleBatteryUpdate);
    }).catch((e) => {
      console.warn('[Battery API] Not accessible:', e);
    });

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', handleBatteryUpdate);
        batteryInstance.removeEventListener('chargingchange', handleBatteryUpdate);
      }
    };
  }, [sendLiveSensorData]);

  // 3. Check for iOS Device Motion Permission requirement
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      setNeedsMotionPermission(true);
    }
  }, []);

  const requestIosMotionPermission = async () => {
    try {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setNeedsMotionPermission(false);
        }
      }
    } catch (e) {
      console.error('Motion permission error:', e);
    }
  };

  // 4. Real Accelerometer & Motion via window.DeviceMotionEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeviceMotion = (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 9.8;

      // Calculate Euclidean acceleration magnitude
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      const gForce = magnitude / 9.80665; // Normalize to standard Gs

      const now = Date.now();

      // Real Fall / Impact Spike Trigger Detection
      if (gForce > 3.4) {
        highGSpikeCountRef.current += 1;
        if (highGSpikeCountRef.current >= 2 && !active_incident) {
          triggerSim('FALL');
          highGSpikeCountRef.current = 0;
        }
      }

      // Throttle live stream updates to 5Hz (200ms)
      if (now - lastMotionSendRef.current >= 200) {
        lastMotionSendRef.current = now;
        setRealMotionActive(true);

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
  }, [sendLiveSensorData, triggerSim, active_incident]);

  const applyManualGpsOverride = (e) => {
    e.preventDefault();
    if (sendLiveSensorData) {
      sendLiveSensorData({
        lat: parseFloat(manualLat),
        lon: parseFloat(manualLon),
        accuracy: 2.0,
        altitude: 1240.0
      });
    }
    setShowGpsOverride(false);
  };

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
              {isCharging ? <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <Battery className="w-3.5 h-3.5" />}
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

          <div className="flex items-center gap-2">
            {active_incident ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                EMERGENCY ACTIVE
              </span>
            ) : realGpsActive || realMotionActive ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NATIVE SENSORS LIVE
              </span>
            ) : (
              <button
                onClick={() => setShowGpsOverride(!showGpsOverride)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-mono text-[9px]"
              >
                <MapPin className="w-2.5 h-2.5" />
                SET GPS
              </button>
            )}
          </div>
        </div>

        {/* ─── iOS PERMISSION BANNER ─── */}
        {needsMotionPermission && (
          <div className="relative z-10 bg-tactical-cyan/20 border-b border-tactical-cyan p-2 flex items-center justify-between text-[10px] font-mono">
            <span className="text-cyan-200">iOS Motion Sensor Access Required</span>
            <button
              onClick={requestIosMotionPermission}
              className="bg-tactical-cyan text-black px-2 py-0.5 rounded font-bold hover:bg-cyan-300"
            >
              ENABLE
            </button>
          </div>
        )}

        {/* ─── MANUAL GPS OVERRIDE PANEL ─── */}
        {showGpsOverride && (
          <form onSubmit={applyManualGpsOverride} className="relative z-20 bg-tactical-dark border-b border-tactical-border p-2.5 flex flex-col gap-1.5 text-[10px] font-mono">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>MANUAL GPS RECALIBRATION</span>
              <button type="button" onClick={() => setShowGpsOverride(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-tactical-muted text-[8px]">LATITUDE</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full bg-tactical-darkest border border-tactical-border px-1.5 py-1 rounded text-white text-[10px]"
                />
              </div>
              <div>
                <label className="text-tactical-muted text-[8px]">LONGITUDE</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="w-full bg-tactical-darkest border border-tactical-border px-1.5 py-1 rounded text-white text-[10px]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-tactical-cyan text-black font-bold py-1 rounded hover:bg-cyan-300 flex items-center justify-center gap-1 mt-1"
            >
              <Check className="w-3 h-3" /> RECALIBRATE SECTOR MAP
            </button>
          </form>
        )}

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
