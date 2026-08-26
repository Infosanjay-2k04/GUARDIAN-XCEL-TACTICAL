import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as api from '../services/api';

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  const [state, setState] = useState({
    tourist: {
      ugid: 'GX-8921-ALPHA',
      full_name: 'Elena Rostova',
      emergency_contact: '+1 (555) 019-2834',
      blood_type: 'O-POS',
      medical_notes: 'Penicillin Allergy / No Chronic Conditions',
      current_lat: 11.3831,
      current_lon: 78.1626,
      altitude: 1240.0,
      battery_pct: 94,
      heart_rate: 76,
      accel_x: 0.02,
      accel_y: 0.04,
      accel_z: 0.99,
      g_force: 1.0,
      threat_level: 'NORMAL',
      comms_channel: 'CELLULAR_4G',
      step_counter: 4120,
      is_active: true
    },
    tourists_list: [
      {
        id: 1,
        ugid: 'GX-8921-ALPHA',
        full_name: 'Elena Rostova',
        emergency_contact: '+1 (555) 019-2834',
        blood_type: 'O-POS',
        medical_notes: 'Penicillin Allergy / No Chronic Conditions',
        current_lat: 11.3831,
        current_lon: 78.1626,
        altitude: 1240.0,
        battery_pct: 94,
        heart_rate: 76,
        g_force: 1.0,
        threat_level: 'NORMAL',
        comms_channel: 'CELLULAR_4G'
      },
      {
        id: 2,
        ugid: 'GX-4412-BRAVO',
        full_name: 'Marcus Vance',
        emergency_contact: '+1 (555) 304-9821',
        blood_type: 'A-POS',
        medical_notes: 'Asthma (Inhaler equipped)',
        current_lat: 11.3845,
        current_lon: 78.1640,
        altitude: 1260.0,
        battery_pct: 88,
        heart_rate: 72,
        g_force: 1.0,
        threat_level: 'NORMAL',
        comms_channel: 'CELLULAR_4G'
      },
      {
        id: 3,
        ugid: 'GX-1109-DELTA',
        full_name: 'Sarah Lin',
        emergency_contact: '+1 (555) 672-1140',
        blood_type: 'B-POS',
        medical_notes: 'Nil Notable / Experienced Hiker',
        current_lat: 11.3820,
        current_lon: 78.1610,
        altitude: 1210.0,
        battery_pct: 91,
        heart_rate: 74,
        g_force: 1.0,
        threat_level: 'NORMAL',
        comms_channel: 'CELLULAR_4G'
      },
      {
        id: 4,
        ugid: 'GX-7723-SIERRA',
        full_name: 'David Kim',
        emergency_contact: '+1 (555) 918-4422',
        blood_type: 'O-NEG',
        medical_notes: 'Type 1 Diabetes (Insulin Carrier)',
        current_lat: 11.3815,
        current_lon: 78.1645,
        altitude: 1225.0,
        battery_pct: 79,
        heart_rate: 80,
        g_force: 1.0,
        threat_level: 'NORMAL',
        comms_channel: 'CELLULAR_4G'
      }
    ],
    tourist_stats: {
      total: 4,
      safe: 4,
      at_risk: 0,
      emergency: 0
    },
    uav: {
      callsign: 'UAV-ALPHA // PHOENIX-1',
      model: 'Guardian SkyScout V4 (FLIR + RTK)',
      status: 'STANDBY',
      current_lat: 11.3866,
      current_lon: 78.1651,
      base_lat: 11.3866,
      base_lon: 78.1651,
      altitude_agl: 0.0,
      battery_pct: 98.5,
      airspeed_mps: 0.0,
      heading_deg: 0.0,
      search_pattern: 'EXPANDING_SQUARE',
      search_progress_pct: 0.0,
      target_locked: false,
      target_confidence: 0.0,
      target_lat: null,
      target_lon: null,
      target_thermal_temp: 0.0,
      telemetry: {
        current_lat: 11.3866,
        current_lng: 78.1651,
        base_lat: 11.3866,
        base_lng: 78.1651,
        altitude_agl: 0.0,
        airspeed_mps: 0.0,
        heading_deg: 0.0
      }
    },
    uav_fleet: [
      {
        drone_id: 'DRONE-01',
        callsign: 'UAV-ALPHA // PHOENIX-1',
        model: 'Guardian SkyScout V4 (FLIR + RTK)',
        role: 'PRIMARY TACTICAL SAR',
        status: 'STANDBY',
        battery_pct: 98.5,
        voltage: 24.8,
        current_lat: 11.3866,
        current_lon: 78.1651,
        altitude_agl: 0.0,
        airspeed_mps: 0.0,
        heading_deg: 0.0,
        signal_rssi_dbm: -54,
        signal_pct: 98,
        mission: 'AREA PATROL (PAD 01)',
        target_locked: false,
        target_confidence: 0.0
      },
      {
        drone_id: 'DRONE-02',
        callsign: 'UAV-BRAVO // VALKYRIE-2',
        model: 'SkyScout RelayNode (LoRa Mesh Air)',
        role: 'LORA MESH AERIAL RELAY',
        status: 'STANDBY',
        battery_pct: 94.0,
        voltage: 24.1,
        current_lat: 11.3865,
        current_lon: 78.1660,
        altitude_agl: 0.0,
        airspeed_mps: 0.0,
        heading_deg: 0.0,
        signal_rssi_dbm: -48,
        signal_pct: 99,
        mission: 'COMMS RELAY STANDBY (PAD 02)',
        target_locked: false,
        target_confidence: 0.0
      },
      {
        drone_id: 'DRONE-03',
        callsign: 'UAV-CHARLIE // SKYWATCH-3',
        model: 'HeavyLifter SAR (Thermal Zoom 10x)',
        role: 'LONG-RANGE THERMAL SCOUT',
        status: 'STANDBY',
        battery_pct: 100.0,
        voltage: 25.2,
        current_lat: 11.3858,
        current_lon: 78.1665,
        altitude_agl: 0.0,
        airspeed_mps: 0.0,
        heading_deg: 0.0,
        signal_rssi_dbm: -42,
        signal_pct: 100,
        mission: 'RESERVE FLEET (PAD 03)',
        target_locked: false,
        target_confidence: 0.0
      }
    ],
    rescue_team: {
      team_callsign: 'TACTICAL SAR // ECHO-4',
      callsign: 'GROUND ECHO-4',
      unit_type: '4x4 ALL-TERRAIN RAPID RESPONSE',
      vehicle_model: 'Polaris Ranger Crew XP 1000 Tactical',
      personnel_count: 4,
      status: 'STANDBY',
      current_lat: 11.3785,
      current_lon: 78.1595,
      base_lat: 11.3785,
      base_lon: 78.1595,
      speed_mps: 0.0,
      speed_kmh: 0.0,
      distance_to_target_m: 650.0,
      eta_seconds: 0,
      eta_minutes: 0.0,
      eta_formatted: '00:00',
      tobler_kinematics: {
        slope_gradient: 0.042,
        slope_deg: 18.4,
        speed_kmh: 28.5,
        formula: 'W = 6 * exp(-3.5 * |slope + 0.05|) [km/h]'
      },
      golden_hour: {
        remaining_seconds: 3520,
        formatted: '58:40',
        progress_pct: 97.8,
        urgency: 'NORMAL'
      }
    },
    thermal_vision: {
      ambient_temp_c: 14.5,
      max_detected_temp_c: 18.5,
      gimbal_pitch_deg: -65.0,
      zoom_level: 2.0,
      palette: 'IRONBOW',
      bounding_box: {
        visible: false,
        x_pct: 50,
        y_pct: 50,
        width_pct: 0,
        height_pct: 0,
        label: 'STANDBY',
        confidence_pct: 0,
        core_temp_c: 14.5,
        status: 'IDLE'
      }
    },
    comms: {
      channel: 'CELLULAR_4G',
      status_text: '4G LTE HIGH BANDWIDTH (RELAY DIRECT)',
      cellular_rssi_dbm: -78,
      lora_snr_db: 8.5,
      packet_counter: 1042,
      hop_count: 1,
      active_protocol: 'HTTPS / WSS JSON',
      packet_loss_pct: 0.2
    },
    active_incident: null,
    departmental_dispatches: {
      is_emergency_active: false,
      timestamp: '00:00:00',
      police: {
        dept_code: 'LAW_ENFORCEMENT_PD',
        agency_name: 'Regional Tactical Police Dispatch (Sector 4)',
        callsign: 'INTERCEPT-710 // PURSUIT-ALPHA',
        status: 'STANDBY_MONITORING',
        status_label: 'PATROL STANDBY',
        target_ugid: 'GX-8921-ALPHA',
        target_coordinates: '11.3995°N, 78.1614°E',
        velocity_vector: 'G-Force: 1.0g | Heading: 214° SW',
        emergency_contact: '+1 (555) 019-2834',
        dispatch_priority: 'ROUTINE',
        encrypted_channel: 'AES-256-GCM // FREQ 155.475 MHz',
        recipient_station: 'CENTRAL POLICE PRECINCT // SECTOR 4 INTERCEPT HUB',
        sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      medical: {
        dept_code: 'MEDICAL_TRAUMA_FASTTRACK',
        agency_name: 'Emergency Medical Services / Mercy Trauma Center',
        callsign: 'MEDIC-33 // ADVANCED-LIFE-SUPPORT',
        hospital_recipient: 'MERCY LEVEL-1 TRAUMA CENTER (TRIAGE BAY 02)',
        status: 'STANDBY_MONITORING',
        status_label: 'STANDBY',
        target_ugid: 'GX-8921-ALPHA',
        blood_type: 'O-POS',
        known_allergies: 'Penicillin (Severe Anaphylaxis Risk)',
        medical_vault_notes: 'Penicillin Allergy / No Chronic Conditions',
        ambulance_unit: 'AMBULANCE ECHO-33',
        ambulance_eta: '--',
        dispatch_priority: 'ROUTINE',
        encrypted_channel: 'HIPAA-SECURE TLS 1.3 // MED-COM 462.950 MHz',
        sha256_hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
      },
      sar: {
        dept_code: 'GROUND_SAR_FOREST',
        agency_name: 'Mountain & Wilderness Search and Rescue Division',
        callsign: 'TACTICAL ALL-TERRAIN UNIT ECHO-4',
        status: 'OUTPOST_STANDBY',
        status_label: 'OUTPOST STANDBY',
        target_ugid: 'GX-8921-ALPHA',
        terrain_entry_point: 'TRAILHEAD ACCESS GATE BRAVO',
        lkp_coordinates: '11.3995°N, 78.1614°E',
        altitude_asl: '1240.0m ASL',
        assigned_vehicle: 'Echo-4 Polaris Ranger High-Clearance ATV',
        rescue_team_eta: '--',
        dispatch_priority: 'ROUTINE',
        encrypted_channel: 'LORA 868MHz TACTICAL MESH // DMR TIER III',
        recipient_station: 'RANGER RESCUE OUTPOST // SECTOR ALPHA',
        sha256_hash: '5b1b68a96d19a4e326b48450f3b438b4df568ff62886f78ee9d4cb7c73228a05'
      },
      encryption_standard: 'AES-256-GCM + SHA-256 FORENSIC AUDIT TRAIL'
    },
    recent_events: [],
    demo_step: 0,
    demo_status_text: 'SYSTEM READY // NORMAL MONITORING',
    landmarks: {
      ranger_hq: { lat: 11.4010, lon: 78.1620, name: 'Tactical Alpha Hub (Ranger HQ)' },
      uav_hangar: { lat: 11.4020, lon: 78.1630, name: 'UAV Drone Base (Pad 01)' },
      rescue_station: { lat: 11.3920, lon: 78.1600, name: 'Ground Rescue Outpost (Unit Echo-4)' }
    }
  });

  const [selectedUgid, setSelectedUgid] = useState('GX-8921-ALPHA');
  const [selectedDroneId, setSelectedDroneId] = useState('DRONE-01');
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('guardian_offline_queue') || '[]');
    } catch {
      return [];
    }
  });
  const [accelHistory, setAccelHistory] = useState([]);
  const wsRef = useRef(null);

  const flushOfflineQueue = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('guardian_offline_queue') || '[]');
      if (stored && stored.length > 0) {
        console.log(`[OfflineSync] Flushing ${stored.length} buffered telemetry frames to backend...`);
        await api.syncOfflineTelemetry(stored);
        localStorage.removeItem('guardian_offline_queue');
        setOfflineQueue([]);
      }
    } catch (e) {
      console.warn('[OfflineSync] Flush failed:', e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Device transitioned to ONLINE. Triggering offline queue sync...');
      setIsOnline(true);
      flushOfflineQueue();
    };

    const handleOffline = () => {
      console.warn('[Network] Device transitioned to OFFLINE / Airplane Mode. Telemetry buffered locally.');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let reconnectTimeout = null;
    let lastDispatchTime = 0;
    let pendingPacket = null;
    let throttleTimeout = null;

    const processIncomingState = (data) => {
      if (data.type === 'STATE_UPDATE') {
        setState(prev => ({
          ...prev,
          tourist: data.tourist || prev.tourist,
          tourists_list: data.tourists_list || prev.tourists_list,
          tourist_stats: data.tourist_stats || prev.tourist_stats,
          uav: isDemoRunningRef.current ? prev.uav : (data.uav || prev.uav),
          uav_fleet: data.uav_fleet || prev.uav_fleet,
          rescue_team: isDemoRunningRef.current ? prev.rescue_team : (data.rescue_team || prev.rescue_team),
          thermal_vision: isDemoRunningRef.current ? prev.thermal_vision : (data.thermal_vision || prev.thermal_vision),
          comms: data.comms || prev.comms,
          active_incident: isDemoRunningRef.current ? prev.active_incident : data.active_incident,
          departmental_dispatches: data.departmental_dispatches || prev.departmental_dispatches,
          forensic_ledger: data.forensic_ledger || prev.forensic_ledger,
          forensic_audit: data.forensic_audit || prev.forensic_audit,
          terrain_profile: data.terrain_profile || prev.terrain_profile,
          recent_events: data.recent_events || prev.recent_events,
          demo_step: isDemoRunningRef.current ? prev.demo_step : data.demo_step,
          demo_status_text: isDemoRunningRef.current ? prev.demo_status_text : data.demo_status_text,
          geofence_safe: data.geofence_safe || prev.geofence_safe,
          geofence_hazard: data.geofence_hazard || prev.geofence_hazard,
          landmarks: data.landmarks || prev.landmarks
        }));

        // Append to waveform history
        if (data.tourist) {
          setAccelHistory(prev => {
            const updated = [...prev, {
              x: data.tourist.accel_x,
              y: data.tourist.accel_y,
              z: data.tourist.accel_z,
              g: data.tourist.g_force,
              hr: data.tourist.heart_rate,
              time: Date.now()
            }];
            return updated.slice(-35); // Keep last 35 points
          });
        }
      }
    };

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = (window.location.port === '5173' || window.location.protocol === 'https:')
        ? window.location.host
        : `${window.location.hostname || '127.0.0.1'}:8000`;
      const wsUrl = `${protocol}//${wsHost}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[SystemWS] Connected to Guardian Xcel Backend');
        setIsConnected(true);
        flushOfflineQueue();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const now = Date.now();
          pendingPacket = data;

          if (now - lastDispatchTime >= 100) {
            if (throttleTimeout) {
              clearTimeout(throttleTimeout);
              throttleTimeout = null;
            }
            lastDispatchTime = now;
            processIncomingState(pendingPacket);
          } else if (!throttleTimeout) {
            throttleTimeout = setTimeout(() => {
              throttleTimeout = null;
              lastDispatchTime = Date.now();
              if (pendingPacket) processIncomingState(pendingPacket);
            }, 100 - (now - lastDispatchTime));
          }
        } catch (err) {
          console.error('[SystemWS] Parse error', err);
        }
      };

      ws.onclose = () => {
        console.warn('[SystemWS] Connection closed. Reconnecting in 2s...');
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (err) => {
        console.error('[SystemWS] Error:', err);
        ws.close();
      };
    }

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, []);

  const sendWebSocketMessage = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const triggerSim = async (mode) => {
    sendWebSocketMessage({ action: 'SIM_ACTION', mode });
    try {
      await api.sendSimAction(mode);
    } catch (e) {
      console.error(e);
    }
  };

  const demoIntervalRef = useRef(null);
  const isDemoRunningRef = useRef(false);
  const demoStartTimeRef = useRef(0);
  const demoElapsedOffsetRef = useRef(0);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isDemoPaused, setIsDemoPaused] = useState(false);

  const VICTIM_LAT = 11.3831;
  const VICTIM_LON = 78.1626;
  const PAD_LAT = 11.3866;
  const PAD_LON = 78.1651;
  const OUTPOST_LAT = 11.3785;
  const OUTPOST_LON = 78.1595;

  const clearDemoRunner = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    isDemoRunningRef.current = false;
    demoElapsedOffsetRef.current = 0;
    setIsDemoRunning(false);
    setIsDemoPaused(false);
  };

  // -------------------------------------------------------------
  // Manual Jury Presentation Triggers (3-Step Fast Workflow)
  // -------------------------------------------------------------
  const triggerManualStep1_SOS = () => {
    clearDemoRunner();
    setState(prev => ({
      ...prev,
      demo_step: 1,
      demo_status_text: 'STEP 1/3: IMPACT DETECTED (3.8g) // LKP LOCKED AT [11.3831°N, 78.1626°E] (CRITICAL)',
      tourist: {
        ...prev.tourist,
        threat_level: 'CRITICAL',
        g_force: 3.8,
        heart_rate: 142,
        current_lat: VICTIM_LAT,
        current_lon: VICTIM_LON,
        accel_x: 0.45,
        accel_y: 2.1,
        accel_z: 3.8
      },
      comms: {
        ...prev.comms,
        channel: 'LORA_MESH',
        status_text: '868MHz LoRa TACTICAL MESH (FAILOVER ACTIVE)'
      },
      active_incident: {
        id: 1,
        incident_number: 'INC-20260826-001',
        status: 'CONFIRMED',
        severity: 'CRITICAL',
        ugid: 'GX-8921-ALPHA',
        trigger_type: 'FALL_DETECTED',
        lkp_lat: VICTIM_LAT,
        lkp_lon: VICTIM_LON,
        target_lat: VICTIM_LAT,
        target_lon: VICTIM_LON,
        lkp_altitude: 1240.0,
        created_at: new Date().toLocaleTimeString()
      },
      departmental_dispatches: {
        ...prev.departmental_dispatches,
        is_emergency_active: true,
        police: {
          ...prev.departmental_dispatches?.police,
          status: 'DISPATCHED',
          status_label: 'DISPATCHED // PURSUIT VECTOR ACTIVE'
        },
        medical: {
          ...prev.departmental_dispatches?.medical,
          status: 'ALERTED',
          status_label: 'HOSPITAL ALERTED // BLOOD MATCHED'
        },
        sar: {
          ...prev.departmental_dispatches?.sar,
          status: 'STANDBY',
          status_label: 'OUTPOST STANDBY'
        }
      }
    }));

    sendWebSocketMessage({ action: 'TRIGGER_SOS', ugid: 'GX-8921-ALPHA', trigger_type: 'FALL_DETECTED' });
    api.triggerSOS('GX-8921-ALPHA', 'FALL_DETECTED').catch(() => {});
  };

  const triggerManualStep2_UAVSearch = () => {
    clearDemoRunner();
    setState(prev => ({
      ...prev,
      demo_step: 2,
      demo_status_text: 'STEP 2/3: UAV AIRBORNE // FLIR THERMAL TARGET LOCK ACQUIRED (36.8°C)',
      uav: {
        ...prev.uav,
        status: 'TARGET_LOCKED',
        current_lat: VICTIM_LAT,
        current_lon: VICTIM_LON,
        altitude_agl: 45.0,
        airspeed_mps: 0.0,
        heading_deg: 214.0,
        target_locked: true,
        target_confidence: 98.2,
        target_lat: VICTIM_LAT,
        target_lon: VICTIM_LON,
        target_thermal_temp: 36.8,
        flight_trail: [[PAD_LAT, PAD_LON], [VICTIM_LAT, VICTIM_LON]]
      },
      thermal_vision: {
        ...prev.thermal_vision,
        bounding_box: {
          visible: true,
          x_pct: 50,
          y_pct: 48,
          width_pct: 35,
          height_pct: 35,
          label: 'TARGET_LOCKED // VICTIM IDENTIFIED',
          confidence_pct: 98.2,
          core_temp_c: 36.8,
          status: 'LOCKED'
        }
      },
      active_incident: prev.active_incident ? {
        ...prev.active_incident,
        status: 'TARGET_LOCKED',
        target_lat: VICTIM_LAT,
        target_lon: VICTIM_LON
      } : {
        id: 1,
        incident_number: 'INC-20260826-001',
        status: 'TARGET_LOCKED',
        severity: 'CRITICAL',
        ugid: 'GX-8921-ALPHA',
        lkp_lat: VICTIM_LAT,
        lkp_lon: VICTIM_LON,
        target_lat: VICTIM_LAT,
        target_lon: VICTIM_LON
      }
    }));

    sendWebSocketMessage({ action: 'DISPATCH_UAV', incident_id: 1, target_lat: VICTIM_LAT, target_lng: VICTIM_LON });
    api.dispatchUAV(1).catch(() => {});
  };

  const triggerManualStep3_GroundRescue = () => {
    clearDemoRunner();
    setState(prev => ({
      ...prev,
      demo_step: 3,
      demo_status_text: 'STEP 3/3: GROUND UNIT ECHO-4 ON-SCENE // RESCUE COMPLETE & MERKLE SEALED',
      rescue_team: {
        ...prev.rescue_team,
        status: 'VICTIM_SECURED',
        current_lat: VICTIM_LAT,
        current_lon: VICTIM_LON,
        speed_kmh: 0.0,
        speed_mps: 0.0,
        distance_to_target_m: 0.0,
        eta_seconds: 0,
        eta_formatted: '00:00'
      },
      active_incident: prev.active_incident ? {
        ...prev.active_incident,
        status: 'RESOLVED'
      } : null
    }));

    sendWebSocketMessage({ action: 'DISPATCH_RESCUE', incident_id: 1 });
    api.dispatchGroundRescue(1).catch(() => {});
    api.resolveIncident(1).catch(() => {});
  };

  const computeAndApplyDemoFrame = (elapsedSec) => {
    if (elapsedSec >= 55.0) {
      // Final Phase 10 hold
      setState(prev => ({
        ...prev,
        demo_step: 10,
        demo_status_text: 'STEP 10/10: RESCUE COMPLETE // SHA-256 MERKLE SEALED',
        uav: {
          ...prev.uav,
          status: 'TARGET_LOCKED',
          current_lat: VICTIM_LAT,
          current_lon: VICTIM_LON,
          altitude_agl: 45.0,
          target_locked: true,
          target_confidence: 98.2
        },
        rescue_team: {
          ...prev.rescue_team,
          status: 'VICTIM_SECURED',
          current_lat: VICTIM_LAT,
          current_lon: VICTIM_LON,
          speed_kmh: 0.0,
          speed_mps: 0.0,
          distance_to_target_m: 0.0,
          eta_seconds: 0,
          eta_formatted: '00:00'
        },
        active_incident: prev.active_incident ? {
          ...prev.active_incident,
          status: 'RESOLVED'
        } : null
      }));
      clearDemoRunner();
      return;
    }

    // Phase 1 (0.0s - 5.5s)
    if (elapsedSec < 5.5) {
      setState(prev => ({
        ...prev,
        demo_step: 1,
        demo_status_text: 'STEP 1/10: TOURIST NOMINAL // GAIT TELEMETRY STREAMING',
        tourist: {
          ...prev.tourist,
          threat_level: 'NORMAL',
          g_force: 1.0,
          heart_rate: 76,
          current_lat: VICTIM_LAT,
          current_lon: VICTIM_LON
        },
        uav: {
          ...prev.uav,
          status: 'STANDBY',
          current_lat: PAD_LAT,
          current_lon: PAD_LON,
          base_lat: PAD_LAT,
          base_lon: PAD_LON,
          altitude_agl: 0.0,
          airspeed_mps: 0.0,
          target_locked: false,
          flight_trail: [[PAD_LAT, PAD_LON]]
        },
        rescue_team: {
          ...prev.rescue_team,
          status: 'STANDBY',
          current_lat: OUTPOST_LAT,
          current_lon: OUTPOST_LON,
          base_lat: OUTPOST_LAT,
          base_lon: OUTPOST_LON,
          speed_kmh: 0.0,
          speed_mps: 0.0,
          distance_to_target_m: 650.0,
          eta_seconds: 0,
          eta_formatted: '00:00'
        },
        comms: {
          ...prev.comms,
          channel: 'CELLULAR_4G',
          status_text: '4G LTE HIGH BANDWIDTH (RELAY DIRECT)'
        },
        departmental_dispatches: {
          ...prev.departmental_dispatches,
          is_emergency_active: false
        },
        active_incident: null
      }));
    }
    // Phase 2 (5.5s - 11.0s)
    else if (elapsedSec < 11.0) {
      setState(prev => ({
        ...prev,
        demo_step: 2,
        demo_status_text: 'STEP 2/10: IMPACT DETECTED // 3.8g KINEMATIC SPIKE',
        tourist: {
          ...prev.tourist,
          threat_level: 'WARNING',
          g_force: 3.8,
          heart_rate: 142,
          accel_x: 0.45,
          accel_y: 2.1,
          accel_z: 3.8
        }
      }));
    }
    // Phase 3 (11.0s - 16.5s)
    else if (elapsedSec < 16.5) {
      setState(prev => ({
        ...prev,
        demo_step: 3,
        demo_status_text: 'STEP 3/10: IMMOBILITY TRIGGERED // THREAT CRITICAL',
        tourist: {
          ...prev.tourist,
          threat_level: 'CRITICAL',
          g_force: 0.02,
          heart_rate: 54,
          accel_x: 0.01,
          accel_y: 0.01,
          accel_z: 0.02
        }
      }));
    }
    // Phase 4 (16.5s - 22.0s)
    else if (elapsedSec < 22.0) {
      setState(prev => ({
        ...prev,
        demo_step: 4,
        demo_status_text: 'STEP 4/10: LKP ENCRYPTED & LOCKED // RADAR BOUNDS ACTIVE',
        comms: {
          ...prev.comms,
          channel: 'LORA_MESH',
          status_text: '868MHz LoRa TACTICAL MESH (FAILOVER ACTIVE)'
        },
        active_incident: {
          id: 1,
          incident_number: 'INC-20260826-001',
          status: 'CONFIRMED',
          severity: 'CRITICAL',
          ugid: 'GX-8921-ALPHA',
          trigger_type: 'FALL_DETECTED',
          lkp_lat: VICTIM_LAT,
          lkp_lon: VICTIM_LON,
          lkp_altitude: 1240.0,
          created_at: new Date().toLocaleTimeString()
        }
      }));
    }
    // Phase 5 (22.0s - 27.5s)
    else if (elapsedSec < 27.5) {
      setState(prev => ({
        ...prev,
        demo_step: 5,
        demo_status_text: 'STEP 5/10: OASIS CAP v1.2 MULTI-AGENCY DISPATCH',
        departmental_dispatches: {
          ...prev.departmental_dispatches,
          is_emergency_active: true,
          police: {
            ...prev.departmental_dispatches?.police,
            status: 'DISPATCHED',
            status_label: 'DISPATCHED // PURSUIT VECTOR ACTIVE'
          },
          medical: {
            ...prev.departmental_dispatches?.medical,
            status: 'ALERTED',
            status_label: 'HOSPITAL ALERTED // BLOOD MATCHED'
          },
          sar: {
            ...prev.departmental_dispatches?.sar,
            status: 'STANDBY',
            status_label: 'OUTPOST STANDBY'
          }
        }
      }));
    }
    // Phase 6 (27.5s - 33.0s: Smooth UAV Transit Animation)
    else if (elapsedSec < 33.0) {
      const p = Math.min(1.0, (elapsedSec - 27.5) / 5.5);
      const curUavLat = Number((PAD_LAT + (VICTIM_LAT - PAD_LAT) * p).toFixed(6));
      const curUavLon = Number((PAD_LON + (VICTIM_LON - PAD_LON) * p).toFixed(6));
      const curAlt = Math.round(45.0 * Math.min(1.0, p * 1.8));

      setState(prev => ({
        ...prev,
        demo_step: 6,
        demo_status_text: 'STEP 6/10: UAV AIRBORNE // TRANSIT TO LKP',
        uav: {
          ...prev.uav,
          status: 'EN_ROUTE_LKP',
          current_lat: curUavLat,
          current_lon: curUavLon,
          altitude_agl: curAlt,
          airspeed_mps: 24.0,
          heading_deg: 214.0,
          flight_trail: [...(prev.uav.flight_trail || []), [curUavLat, curUavLon]].slice(-35)
        },
        active_incident: prev.active_incident ? {
          ...prev.active_incident,
          status: 'UAV_DISPATCHED'
        } : null
      }));
    }
    // Phase 7 (33.0s - 38.5s: ISRID Expanding Square Search)
    else if (elapsedSec < 38.5) {
      const p = (elapsedSec - 33.0) / 5.5;
      const theta = p * Math.PI * 4;
      const radius = 0.00035 * p;
      const curUavLat = Number((VICTIM_LAT + radius * Math.sin(theta)).toFixed(6));
      const curUavLon = Number((VICTIM_LON + radius * Math.cos(theta)).toFixed(6));

      setState(prev => ({
        ...prev,
        demo_step: 7,
        demo_status_text: 'STEP 7/10: ISRID SECTOR SCANNING // EXPANDING SQUARE',
        uav: {
          ...prev.uav,
          status: 'SEARCHING',
          current_lat: curUavLat,
          current_lon: curUavLon,
          altitude_agl: 45.0,
          airspeed_mps: 14.0,
          search_progress_pct: Math.round(p * 85.0),
          flight_trail: [...(prev.uav.flight_trail || []), [curUavLat, curUavLon]].slice(-45)
        }
      }));
    }
    // Phase 8 (38.5s - 44.0s: FLIR Thermal Target Lock)
    else if (elapsedSec < 44.0) {
      setState(prev => ({
        ...prev,
        demo_step: 8,
        demo_status_text: 'STEP 8/10: FLIR THERMAL LOCK // VICTIM ACQUIRED (36.8°C)',
        uav: {
          ...prev.uav,
          status: 'TARGET_LOCKED',
          current_lat: VICTIM_LAT,
          current_lon: VICTIM_LON,
          target_locked: true,
          target_confidence: 98.2,
          target_lat: VICTIM_LAT,
          target_lon: VICTIM_LON,
          altitude_agl: 45.0,
          airspeed_mps: 0.0
        },
        thermal_vision: {
          ...prev.thermal_vision,
          bounding_box: {
            visible: true,
            x_pct: 50,
            y_pct: 48,
            width_pct: 35,
            height_pct: 35,
            label: 'TARGET_LOCKED // VICTIM IDENTIFIED',
            confidence_pct: 98.2,
            core_temp_c: 36.8,
            status: 'LOCKED'
          }
        },
        active_incident: prev.active_incident ? {
          ...prev.active_incident,
          status: 'TARGET_LOCKED'
        } : null
      }));
    }
    // Phase 9 (44.0s - 49.5s: Smooth Ground Team Intercept Animation)
    else if (elapsedSec < 49.5) {
      const g = Math.min(1.0, (elapsedSec - 44.0) / 5.5);
      const curGroundLat = Number((OUTPOST_LAT + (VICTIM_LAT - OUTPOST_LAT) * g).toFixed(6));
      const curGroundLon = Number((OUTPOST_LON + (VICTIM_LON - OUTPOST_LON) * g).toFixed(6));
      const distRemaining = Math.round(650.0 * (1.0 - g));
      const etaSec = Math.max(0, Math.round(30.0 * (1.0 - g)));
      const etaFormatted = `00:${etaSec < 10 ? '0' : ''}${etaSec}`;

      setState(prev => ({
        ...prev,
        demo_step: 9,
        demo_status_text: 'STEP 9/10: GROUND UNIT ECHO-4 INTERCEPT // ON-SCENE',
        rescue_team: {
          ...prev.rescue_team,
          status: 'EN_ROUTE',
          current_lat: curGroundLat,
          current_lon: curGroundLon,
          speed_kmh: 34.2,
          speed_mps: 9.5,
          distance_to_target_m: distRemaining,
          eta_seconds: etaSec,
          eta_formatted: etaFormatted
        },
        active_incident: prev.active_incident ? {
          ...prev.active_incident,
          status: 'RESCUE_EN_ROUTE'
        } : null
      }));
    }
    // Phase 10 (49.5s - 55.0s: Rescue Complete & Sealed)
    else {
      setState(prev => ({
        ...prev,
        demo_step: 10,
        demo_status_text: 'STEP 10/10: RESCUE COMPLETE // SHA-256 MERKLE SEALED',
        rescue_team: {
          ...prev.rescue_team,
          status: 'VICTIM_SECURED',
          current_lat: VICTIM_LAT,
          current_lon: VICTIM_LON,
          speed_kmh: 0.0,
          speed_mps: 0.0,
          distance_to_target_m: 0.0,
          eta_seconds: 0,
          eta_formatted: '00:00'
        },
        active_incident: prev.active_incident ? {
          ...prev.active_incident,
          status: 'RESOLVED'
        } : null
      }));
    }
  };

  const startDemo = () => {
    clearDemoRunner();
    isDemoRunningRef.current = true;
    demoElapsedOffsetRef.current = 0;
    demoStartTimeRef.current = Date.now();
    setIsDemoRunning(true);
    setIsDemoPaused(false);

    // Trigger backend demo logging in background without blocking
    sendWebSocketMessage({ action: 'START_DEMO' });
    api.startFullDemo().catch(() => {});

    demoIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - demoStartTimeRef.current + demoElapsedOffsetRef.current;
      const elapsedSec = elapsedMs / 1000.0;
      computeAndApplyDemoFrame(elapsedSec);
    }, 100);
  };

  const pauseDemo = () => {
    if (!isDemoRunningRef.current || isDemoPaused) return;
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    demoElapsedOffsetRef.current += (Date.now() - demoStartTimeRef.current);
    setIsDemoPaused(true);
  };

  const resumeDemo = () => {
    if (!isDemoRunningRef.current || !isDemoPaused) return;
    demoStartTimeRef.current = Date.now();
    setIsDemoPaused(false);

    demoIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - demoStartTimeRef.current + demoElapsedOffsetRef.current;
      const elapsedSec = elapsedMs / 1000.0;
      computeAndApplyDemoFrame(elapsedSec);
    }, 100);
  };

  const jumpToPhase = (phaseNum) => {
    const clampedPhase = Math.max(1, Math.min(10, phaseNum));
    const targetElapsedSec = (clampedPhase - 1) * 5.5 + 0.1;
    
    if (isDemoRunningRef.current && !isDemoPaused) {
      demoStartTimeRef.current = Date.now();
      demoElapsedOffsetRef.current = targetElapsedSec * 1000.0;
    } else {
      isDemoRunningRef.current = true;
      demoElapsedOffsetRef.current = targetElapsedSec * 1000.0;
      setIsDemoRunning(true);
      setIsDemoPaused(true); // stay paused on manual step
    }
    
    computeAndApplyDemoFrame(targetElapsedSec);
  };

  const stepNextDemo = () => {
    const currentPhase = state.demo_step || 1;
    jumpToPhase(Math.min(10, currentPhase + 1));
  };

  const stepPrevDemo = () => {
    const currentPhase = state.demo_step || 1;
    jumpToPhase(Math.max(1, currentPhase - 1));
  };

  const resetSystem = () => {
    clearDemoRunner();

    setState(prev => ({
      ...prev,
      demo_step: 0,
      demo_status_text: 'SYSTEM READY // NORMAL MONITORING',
      tourist: {
        ...prev.tourist,
        threat_level: 'NORMAL',
        g_force: 1.0,
        heart_rate: 76,
        battery_pct: 94,
        current_lat: VICTIM_LAT,
        current_lon: VICTIM_LON
      },
      comms: {
        ...prev.comms,
        channel: 'CELLULAR_4G',
        status_text: '4G LTE HIGH BANDWIDTH (RELAY DIRECT)'
      },
      uav: {
        ...prev.uav,
        status: 'STANDBY',
        current_lat: PAD_LAT,
        current_lon: PAD_LON,
        base_lat: PAD_LAT,
        base_lon: PAD_LON,
        altitude_agl: 0.0,
        airspeed_mps: 0.0,
        target_locked: false,
        target_confidence: 0.0,
        flight_trail: [[PAD_LAT, PAD_LON]]
      },
      rescue_team: {
        ...prev.rescue_team,
        status: 'STANDBY',
        current_lat: OUTPOST_LAT,
        current_lon: OUTPOST_LON,
        base_lat: OUTPOST_LAT,
        base_lon: OUTPOST_LON,
        speed_kmh: 0.0,
        speed_mps: 0.0,
        distance_to_target_m: 650.0,
        eta_seconds: 0,
        eta_formatted: '00:00'
      },
      thermal_vision: {
        ...prev.thermal_vision,
        bounding_box: {
          visible: false,
          x_pct: 50,
          y_pct: 50,
          width_pct: 0,
          height_pct: 0,
          label: 'STANDBY',
          confidence_pct: 0,
          core_temp_c: 14.5,
          status: 'IDLE'
        }
      },
      departmental_dispatches: {
        ...prev.departmental_dispatches,
        is_emergency_active: false
      },
      active_incident: null
    }));

    sendWebSocketMessage({ action: 'RESET_SYSTEM' });
    api.resetSystemDemo().catch(() => {});
  };

  const sendUavCommand = (action, customPayload = {}) => {
    const victimLat = customPayload.lat || state.active_incident?.lkp_lat || state.tourist?.current_lat || 11.3995;
    const victimLng = customPayload.lon || customPayload.lng || state.active_incident?.lkp_lon || state.tourist?.current_lon || 78.1614;
    
    const padLat = Number((victimLat + 0.0035).toFixed(6));
    const padLng = Number((victimLng + 0.0025).toFixed(6));

    const payload = {
      type: 'UAV_COMMAND',
      action,
      target_ugid: selectedUgid || 'GX-8921-ALPHA',
      incident_id: customPayload.incident_id || state.active_incident?.id,
      base_pad: {
        lat: padLat,
        lng: padLng
      },
      lkp: {
        lat: victimLat,
        lng: victimLng
      },
      ...customPayload
    };

    console.log('[UAV COMMAND SENT]', action, payload);
    sendWebSocketMessage(payload);
  };

  const dispatchUav = async (incidentId, customCoords = null) => {
    sendUavCommand('DISPATCH_UAV', {
      incident_id: incidentId,
      lat: customCoords?.lat,
      lon: customCoords?.lon || customCoords?.lng
    });
    try {
      await api.dispatchUAV(incidentId);
    } catch (e) {
      console.error(e);
    }
  };

  const startUavSearch = async () => {
    sendUavCommand('START_SEARCH');
    try {
      await api.startUavSearch();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerThermalScan = async () => {
    sendUavCommand('TRIGGER_THERMAL');
    try {
      await api.triggerThermalScan();
    } catch (e) {
      console.error(e);
    }
  };

  const lockTarget = async () => {
    sendUavCommand('LOCK_TARGET');
    try {
      await api.triggerThermalScan();
    } catch (e) {
      console.error(e);
    }
  };

  const returnUavToBase = async () => {
    sendUavCommand('RETURN_TO_BASE');
    try {
      await api.returnUavToBase();
    } catch (e) {
      console.error(e);
    }
  };

  const resetUav = async () => {
    sendUavCommand('RESET_UAV');
  };

  const dispatchRescue = async (incidentId) => {
    sendWebSocketMessage({ action: 'DISPATCH_RESCUE', incident_id: incidentId });
    try {
      await api.dispatchRescueTeam(incidentId);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveIncident = async (incidentId) => {
    sendWebSocketMessage({ action: 'RESOLVE_INCIDENT', incident_id: incidentId });
    try {
      await api.resolveIncident(incidentId);
    } catch (e) {
      console.error(e);
    }
  };

  const sendLiveSensorData = (sensorPayload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendWebSocketMessage({
        action: 'LIVE_SENSOR_UPDATE',
        ...sensorPayload
      });
    } else {
      // Buffer offline packet in local storage
      try {
        const stored = JSON.parse(localStorage.getItem('guardian_offline_queue') || '[]');
        const updated = [...stored, {
          ...sensorPayload,
          timestamp: new Date().toISOString()
        }].slice(-100);
        localStorage.setItem('guardian_offline_queue', JSON.stringify(updated));
        setOfflineQueue(updated);
      } catch (err) {
        console.error('[OfflineQueue] Storage error:', err);
      }
    }
  };

  return (
    <SystemContext.Provider
      value={{
        ...state,
        selectedUgid,
        setSelectedUgid,
        selectedDroneId,
        setSelectedDroneId,
        isConnected,
        isOnline,
        isDemoRunning,
        isDemoPaused,
        demoPhase: state.demo_step,
        demoStep: state.demo_step,
        manualStep: state.demo_step,
        triggerManualStep1_SOS,
        triggerManualStep2_UAVSearch,
        triggerManualStep3_GroundRescue,
        offlineQueueLength: offlineQueue.length,
        flushOfflineQueue,
        accelHistory,
        triggerSim,
        sendLiveSensorData,
        startDemo,
        pauseDemo,
        resumeDemo,
        jumpToPhase,
        stepNextDemo,
        stepPrevDemo,
        resetSystem,
        sendUavCommand,
        dispatchUav,
        startUavSearch,
        triggerThermalScan,
        lockTarget,
        returnUavToBase,
        resetUav,
        dispatchRescue,
        dispatchGroundRescue: dispatchRescue,
        forceGroundDispatch: dispatchRescue,
        resolveIncident
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
