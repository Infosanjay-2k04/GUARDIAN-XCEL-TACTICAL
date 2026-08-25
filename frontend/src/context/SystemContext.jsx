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
      current_lat: 37.7420,
      current_lon: -119.5975,
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
        current_lat: 37.7420,
        current_lon: -119.5975,
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
        current_lat: 37.7510,
        current_lon: -119.5890,
        altitude: 1410.0,
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
        current_lat: 37.7465,
        current_lon: -119.6015,
        altitude: 1180.0,
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
        current_lat: 37.7395,
        current_lon: -119.5840,
        altitude: 1320.0,
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
      current_lat: 37.7490,
      current_lon: -119.5860,
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
      target_thermal_temp: 0.0
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
        current_lat: 37.7490,
        current_lon: -119.5860,
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
        current_lat: 37.7492,
        current_lon: -119.5855,
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
        current_lat: 37.7488,
        current_lon: -119.5865,
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
      team_callsign: 'GROUND ECHO-4',
      unit_type: 'Tactical All-Terrain Rapid Response',
      status: 'STANDBY',
      current_lat: 37.7478,
      current_lon: -119.5880,
      speed_mps: 0.0,
      eta_seconds: 0
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
        target_coordinates: '37.74200°N, 119.59750°W',
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
        terrain_entry_point: 'TRAILHEAD ACCESS GATE BRAVO (GRID 37-119)',
        lkp_coordinates: '37.74200°N, 119.59750°W',
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
      ranger_hq: { lat: 37.7485, lon: -119.5870, name: 'Tactical Alpha Hub (Ranger HQ)' },
      uav_hangar: { lat: 37.7490, lon: -119.5860, name: 'UAV Drone Base (Pad 01)' },
      rescue_station: { lat: 37.7478, lon: -119.5880, name: 'Ground Rescue Outpost (Unit Echo-4)' }
    }
  });

  const [selectedUgid, setSelectedUgid] = useState('GX-8921-ALPHA');
  const [selectedDroneId, setSelectedDroneId] = useState('DRONE-01');
  const [isConnected, setIsConnected] = useState(false);
  const [accelHistory, setAccelHistory] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

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
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_UPDATE') {
            setState(prev => ({
              ...prev,
              tourist: data.tourist || prev.tourist,
              tourists_list: data.tourists_list || prev.tourists_list,
              tourist_stats: data.tourist_stats || prev.tourist_stats,
              uav: data.uav || prev.uav,
              uav_fleet: data.uav_fleet || prev.uav_fleet,
              rescue_team: data.rescue_team || prev.rescue_team,
              thermal_vision: data.thermal_vision || prev.thermal_vision,
              comms: data.comms || prev.comms,
              active_incident: data.active_incident,
              departmental_dispatches: data.departmental_dispatches || prev.departmental_dispatches,
              forensic_ledger: data.forensic_ledger || prev.forensic_ledger,
              forensic_audit: data.forensic_audit || prev.forensic_audit,
              terrain_profile: data.terrain_profile || prev.terrain_profile,
              recent_events: data.recent_events || prev.recent_events,
              demo_step: data.demo_step,
              demo_status_text: data.demo_status_text,
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

  const startDemo = async () => {
    sendWebSocketMessage({ action: 'START_DEMO' });
    try {
      await api.startFullDemo();
    } catch (e) {
      console.error(e);
    }
  };

  const resetSystem = async () => {
    sendWebSocketMessage({ action: 'RESET_SYSTEM' });
    try {
      await api.resetSystemDemo();
    } catch (e) {
      console.error(e);
    }
  };

  const dispatchUav = async (incidentId) => {
    sendWebSocketMessage({ action: 'DISPATCH_UAV', incident_id: incidentId });
    try {
      await api.dispatchUAV(incidentId);
    } catch (e) {
      console.error(e);
    }
  };

  const startUavSearch = async () => {
    sendWebSocketMessage({ action: 'START_SEARCH' });
    try {
      await api.startUavSearch();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerThermalScan = async () => {
    sendWebSocketMessage({ action: 'TRIGGER_THERMAL' });
    try {
      await api.triggerThermalScan();
    } catch (e) {
      console.error(e);
    }
  };

  const returnUavToBase = async () => {
    sendWebSocketMessage({ action: 'RETURN_TO_BASE' });
    try {
      await api.returnUavToBase();
    } catch (e) {
      console.error(e);
    }
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
    sendWebSocketMessage({
      action: 'LIVE_SENSOR_UPDATE',
      ...sensorPayload
    });
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
        accelHistory,
        triggerSim,
        sendLiveSensorData,
        startDemo,
        resetSystem,
        dispatchUav,
        startUavSearch,
        triggerThermalScan,
        returnUavToBase,
        dispatchRescue,
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
