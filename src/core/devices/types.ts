export type DeviceTransport = "web-bluetooth" | "web-hid" | "web-serial" | "network-gateway" | "native-bridge";
export type DeviceStatus = "available" | "connecting" | "connected" | "disconnected" | "error" | "revoked";
export type DeviceCapability = "temperature" | "humidity" | "soil-moisture" | "weight" | "barcode" | "qr-code" | "printing" | "location" | "gnss" | "flight-telemetry" | "power" | "serial-data" | "hid-input" | "camera" | "environmental" | "inventory-count" | "point-of-sale" | "display" | "scanning" | "touch" | "soil-temperature" | "soil-ph" | "electrical-conductivity" | "rainfall" | "wind" | "water-level";
export interface DeviceEvent { deviceId: string; type: "connected" | "disconnected" | "data" | "error" | "status"; timestamp: string; payload?: unknown; }
export interface ComponentDeviceRequirement { appId: string; appName: string; componentId: string; componentName: string; capabilities: DeviceCapability[]; transports: DeviceTransport[]; description: string; }
