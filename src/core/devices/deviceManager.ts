import type { DeviceEvent, DeviceTransport } from "./types";
type Listener = (event: DeviceEvent) => void;
const listeners = new Set<Listener>();
const active = new Map<string, { transport: DeviceTransport; close: () => Promise<void> }>();
function emit(event: DeviceEvent) { listeners.forEach(listener => listener(event)); }
export function subscribeToDeviceEvents(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function registerActiveConnection(id: string, transport: DeviceTransport, close: () => Promise<void>) { active.set(id, { transport, close }); emit({ deviceId: id, type: "connected", timestamp: new Date().toISOString(), payload: { transport } }); }
export function publishDeviceData(id: string, payload: unknown) { emit({ deviceId: id, type: "data", timestamp: new Date().toISOString(), payload }); }
export function publishDeviceError(id: string, error: unknown) { emit({ deviceId: id, type: "error", timestamp: new Date().toISOString(), payload: { message: error instanceof Error ? error.message : String(error) } }); }
export async function disconnectDevice(id: string) { const connection = active.get(id); if (!connection) return; active.delete(id); await connection.close(); emit({ deviceId: id, type: "disconnected", timestamp: new Date().toISOString() }); }
export function isDeviceConnected(id: string) { return active.has(id); }
export function getActiveDeviceIds() { return [...active.keys()]; }
