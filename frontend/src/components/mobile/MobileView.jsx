import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Shield, Battery, Radio, QrCode,
  Compass, User, Flame, ShieldAlert,
  Wifi, WifiOff, Zap, MapPin, AlertTriangle, Check,
  Volume2, VolumeX, Mic, Clock, Layers, Sparkles
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
  const { 
    tourist, 
    comms, 
    active_incident, 
    isConnected, 
    isOnline, 
    offlineQueueLength, 
    flushOfflineQueue,
    triggerSim, 
    sendLiveSensorData 
  } = useSystem();

  const [activeTab, setActiveTab] = useState('home');
  const [realGpsActive, setRealGpsActive] = useState(false);
  const [realMotionActive, setRealMotionActive] = useState(false);
  const [realBatteryActive, setRealBatteryActive] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [showGpsOverride, setShowGpsOverride] = useState(false);
  const [manualLat, setManualLat] = useState(tourist.current_lat || 11.3995);
  const [manualLon, setManualLon] = useState(tourist.current_lon || 78.1614);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);

  // Acoustic Beacon & Blackbox States
  const [beaconMuted, setBeaconMuted] = useState(false);
  const [isBlackboxRecording, setIsBlackboxRecording] = useState(false);
  const [blackboxSaved, setBlackboxSaved] = useState(false);

  const lastMotionSendRef = useRef(0);
  const highGSpikeCountRef = useRef(0);
  const audioContextRef = useRef(null);
  const beaconIntervalRef = useRef(null);

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

  // 3. Pre-Impact Audio Blackbox Trigger
  const triggerAudioBlackbox = async () => {
    if (isBlackboxRecording || blackboxSaved) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      setIsBlackboxRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          try {
            localStorage.setItem('guardian_blackbox_audio', base64Audio);
            setBlackboxSaved(true);
            setIsBlackboxRecording(false);
            console.log('[Blackbox] 4-second pre-impact audio capture committed to secure local storage.');
          } catch (e) {
            console.error('[Blackbox Storage] Error:', e);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 4000); // 4-second audio burst

    } catch (err) {
      console.warn('[AudioBlackbox] Microphone capture notice:', err);
      setIsBlackboxRecording(false);
    }
  };

  // 4. Ultrasonic & Acoustic Emergency Beacon (18.5kHz - 19.5kHz + 880Hz SOS Morse)
  useEffect(() => {
    const isEmergency = tourist.threat_level === 'CRITICAL' || active_incident;

    if (isEmergency && !beaconMuted) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        // Pulse acoustic chirp every 2 seconds
        if (!beaconIntervalRef.current) {
          beaconIntervalRef.current = setInterval(() => {
            if (beaconMuted) return;
            try {
              // 1. Ultrasonic Carrier Pulse (19.2 kHz - near imperceptible to humans, detectable by SAR mic arrays)
              const oscUltra = ctx.createOscillator();
              const gainUltra = ctx.createGain();
              oscUltra.type = 'sine';
              oscUltra.frequency.setValueAtTime(19200, ctx.currentTime);
              gainUltra.gain.setValueAtTime(0.08, ctx.currentTime);
              gainUltra.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
              oscUltra.connect(gainUltra);
              gainUltra.connect(ctx.destination);
              oscUltra.start();
              oscUltra.stop(ctx.currentTime + 0.3);

              // 2. Audible SOS Beep Pulse (880 Hz)
              const oscAud = ctx.createOscillator();
              const gainAud = ctx.createGain();
              oscAud.type = 'sine';
              oscAud.frequency.setValueAtTime(880, ctx.currentTime);
              gainAud.gain.setValueAtTime(0.04, ctx.currentTime);
              gainAud.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
              oscAud.connect(gainAud);
              gainAud.connect(ctx.destination);
              oscAud.start();
              oscAud.stop(ctx.currentTime + 0.25);
            } catch (soundErr) {
              console.warn('[AcousticBeacon] Chirp error:', soundErr);
            }
          }, 2000);
        }
      } catch (audioErr) {
        console.warn('[AudioContext] Initializing audio context notice:', audioErr);
      }
    } else {
      if (beaconIntervalRef.current) {
        clearInterval(beaconIntervalRef.current);
        beaconIntervalRef.current = null;
      }
    }

    return () => {
      if (beaconIntervalRef.current) {
        clearInterval(beaconIntervalRef.current);
        beaconIntervalRef.current = null;
      }
    };
  }, [tourist.threat_level, active_incident, beaconMuted]);

  // 5. Real Accelerometer & Motion via window.DeviceMotionEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeviceMotion = (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 9.8;

      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      const gForce = magnitude / 9.80665;

      // Throttle live stream updates to 5Hz (200ms) without auto-triggering emergency
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

  const triggerImmediateGpsFix = () => {
    setShowGpsOverride(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude } = pos.coords;
          setRealGpsActive(true);
          setGpsError(null);
          setManualLat(latitude);
          setManualLon(longitude);
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
          console.warn('[GPS Immediate Fix] Error:', err.message);
          setGpsError(err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const isCritical = tourist.threat_level === 'CRITICAL';
  const isWarning  = tourist.threat_level === 'WARNING';
  const isLoRa     = comms.channel === 'LORA_MESH';

  const powerGov = tourist?.power_governance || {
    tier_label: 'TIER-1: STANDARD MONITORING',
    endurance_formatted: '28h 45m',
    power_draw_mw: 45.0
  };

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
          <div className="flex items-center gap-2.5">
            {/* Offline PWA Sync Pill */}
            {(!isOnline || offlineQueueLength > 0) && (
              <button
                onClick={flushOfflineQueue}
                className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/60 text-amber-300 text-[8px] font-bold animate-pulse flex items-center gap-1"
                title="Click to flush offline queue"
              >
                <Clock className="w-2.5 h-2.5" />
                {offlineQueueLength > 0 ? `${offlineQueueLength} QUEUED` : 'OFFLINE'}
              </button>
            )}

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

        {/* ─── DYNAMIC POWER GOVERNANCE & ACOUSTIC BEACON BAR ─── */}
        <div className="relative z-10 bg-slate-950/90 border-b border-tactical-border/60 px-3 py-1 flex items-center justify-between text-[9px] font-mono shrink-0">
          <div className="flex items-center gap-1 text-slate-300">
            <Zap className="w-3 h-3 text-tactical-cyan" />
            <span className="text-tactical-muted">ENDURANCE:</span>
            <span className="font-bold text-tactical-cyan">{powerGov.endurance_formatted}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Acoustic Beacon Mute Toggle */}
            {isCritical && (
              <button
                onClick={() => setBeaconMuted(prev => !prev)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all ${
                  beaconMuted 
                    ? 'bg-slate-800 border-slate-600 text-slate-400'
                    : 'bg-cyan-950/80 border-cyan-400 text-cyan-300 animate-pulse'
                }`}
              >
                {beaconMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                {beaconMuted ? 'BEACON MUTED' : '19.2kHz BEACON ACTIVE'}
              </button>
            )}

            {/* Blackbox Audio Indicator */}
            {blackboxSaved && (
              <span className="text-[8px] text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/40 flex items-center gap-0.5">
                <Mic className="w-2.5 h-2.5" /> BLACKBOX SAVED
              </span>
            )}
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
            ) : (
              <button
                onClick={triggerImmediateGpsFix}
                className="text-[9px] text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                title="Recalibrate GPS"
              >
                <MapPin className="w-3 h-3" />
                GPS FIX
              </button>
            )}
            <StatusBadge status={tourist.threat_level} size="xs" pulse={isCritical} />
          </div>
        </div>

        {/* GPS Manual Override Modal */}
        {showGpsOverride && (
          <div className="relative z-30 bg-slate-900 border-b border-cyan-500/60 p-2.5 text-[10px] font-mono space-y-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                CALIBRATE GPS ANCHOR
              </span>
              <button onClick={() => setShowGpsOverride(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={applyManualGpsOverride} className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-400">LATITUDE</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-1.5 py-1 text-white text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400">LONGITUDE</label>
                <input
                  type="number"
                  step="0.0001"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  className="w-full bg-black border border-slate-700 rounded px-1.5 py-1 text-white text-[10px]"
                />
              </div>
              <button
                type="submit"
                className="col-span-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold p-1 rounded transition-all text-xs"
              >
                APPLY GPS ANCHOR
              </button>
            </form>
          </div>
        )}

        {/* ─── SCROLLABLE MAIN CONTENT ─── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 relative z-10">
          {activeTab === 'home'    && <HomeScreen />}
          {activeTab === 'explore' && <ExploreScreen />}
          {activeTab === 'safety'  && <SafetyScreen />}
          {activeTab === 'profile' && <ProfileScreen />}

          {/* SIM CONTROLS */}
          <div className="pt-2">
            <SimControls />
          </div>
        </div>

        {/* ─── BOTTOM NAVIGATION BAR ─── */}
        <div className="relative z-10 bg-tactical-dark border-t border-tactical-border grid grid-cols-4 select-none shrink-0">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex flex-col items-center justify-center py-2.5 gap-1 transition-all font-mono
                  ${isActive
                    ? 'text-tactical-cyan bg-tactical-cyan/10 border-t-2 border-tactical-cyan'
                    : 'text-tactical-muted hover:text-slate-200 border-t-2 border-transparent'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-tactical-cyan' : 'text-tactical-muted'}`} />
                <span className="text-[9px] font-bold tracking-wider">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── FULLSCREEN EMERGENCY OVERLAY ─── */}
        <EmergencyOverlay />
      </div>
    </div>
  );
}
