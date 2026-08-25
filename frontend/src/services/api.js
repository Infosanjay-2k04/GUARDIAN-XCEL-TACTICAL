// Dynamically resolve backend host from current window location
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:' || window.location.port === '5173') {
      return '/api/v1'; // Proxied cleanly through Vite HTTPS/HTTP server
    }
    if (window.location.hostname) {
      return `http://${window.location.hostname}:8000/api/v1`;
    }
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

export async function fetchTouristProfile() {
  const res = await fetch(`${API_BASE}/tourist/profile`);
  if (!res.ok) throw new Error('Failed to fetch tourist profile');
  return res.json();
}

export async function sendSimAction(action) {
  const res = await fetch(`${API_BASE}/tourist/sim-action?action=${encodeURIComponent(action)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function triggerManualEmergency(ugid, triggerType = 'MANUAL_SOS', notes = '') {
  const res = await fetch(`${API_BASE}/tourist/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ugid, trigger_type: triggerType, notes })
  });
  return res.json();
}

export async function dispatchUAV(incidentId) {
  const url = incidentId 
    ? `${API_BASE}/incidents/${incidentId}/dispatch-uav`
    : `${API_BASE}/uav/dispatch-active`;
  const res = await fetch(url, { method: 'POST' });
  return res.json();
}

export async function startUavSearch() {
  const res = await fetch(`${API_BASE}/uav/start-search`, { method: 'POST' });
  return res.json();
}

export async function triggerThermalScan() {
  const res = await fetch(`${API_BASE}/uav/trigger-thermal`, { method: 'POST' });
  return res.json();
}

export async function returnUavToBase() {
  const res = await fetch(`${API_BASE}/uav/return-to-base`, { method: 'POST' });
  return res.json();
}

export async function dispatchRescueTeam(incidentId) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/dispatch-rescue`, { method: 'POST' });
  return res.json();
}

export async function resolveIncident(incidentId) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, { method: 'POST' });
  return res.json();
}

export async function startFullDemo() {
  const res = await fetch(`${API_BASE}/demo/start`, { method: 'POST' });
  return res.json();
}

export async function resetSystemDemo() {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  return res.json();
}
