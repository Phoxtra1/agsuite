// src/api/comsApi.ts
export const API_BASE = 'https://coms.amineva.com/a1';

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function sendMessage(payload: any) {
  const res = await fetch(`${API_BASE}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function saveSettings(payload: any) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}
