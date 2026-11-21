import type { ComponentDeviceRequirement, DeviceCapability, DeviceTransport } from "./types";
const requirement = (appId: string, appName: string, componentId: string, componentName: string, capabilities: DeviceCapability[], transports: DeviceTransport[]): ComponentDeviceRequirement => ({ appId, appName, componentId, componentName, capabilities, transports, description: "Capability candidate only. Exact model, protocol and driver validation is required." });
export const COMPONENT_DEVICE_REQUIREMENTS: ComponentDeviceRequirement[] = [
 requirement("agroclimate","AgroClimate","weather-observations","Weather observations",["temperature","humidity","environmental"],["web-bluetooth","web-serial","network-gateway"]),
 requirement("agroclimate","AgroClimate","soil-monitoring","Soil monitoring",["soil-moisture","temperature"],["web-bluetooth","web-serial","network-gateway"]),
 requirement("agroclimate","AgroClimate","agro-risk","AgroRisk monitoring",["temperature","humidity","soil-moisture","location"],["web-bluetooth","web-serial","network-gateway"]),
 requirement("agroclimate","AgroClimate","aerial-console","Aerial Console telemetry",["flight-telemetry","location","gnss"],["web-serial","network-gateway","native-bridge"]),
 requirement("agroclimate","AgroClimate","farm-handler","Farm Handler field operations",["location","gnss","camera"],["native-bridge","network-gateway"]),
 requirement("agroclimate","AgroClimate","agro-inventory","Agro Inventory",["barcode","qr-code","weight","inventory-count"],["web-hid","web-serial","native-bridge"]),
 requirement("agroclimate","AgroClimate","post-harvest","Post-harvest monitoring",["temperature","humidity","environmental"],["web-bluetooth","web-serial","network-gateway"]),
 requirement("agroclimate","AgroClimate","agtrans","AgTrans transport",["location","gnss"],["native-bridge","network-gateway"]),
 requirement("agroclimate","AgroClimate","market-link","Market Link operations",["barcode","qr-code","weight"],["web-hid","web-serial","native-bridge"]),
 requirement("agroclimate","AgroClimate","agro-forecast","AgroForecast",["temperature","humidity","environmental"],["web-bluetooth","network-gateway"]),
 requirement("inventra","Inventra","stock-control","Stock control",["barcode","qr-code","weight","inventory-count"],["web-hid","web-serial","native-bridge"]),
 requirement("inventra","Inventra","sales-checkout","Sales and checkout",["barcode","qr-code","point-of-sale","printing"],["web-hid","web-serial","native-bridge"]),
 requirement("inventra","Inventra","receipts-labels","Receipts and labels",["printing"],["web-hid","web-serial","native-bridge"]),
 requirement("inventra","Inventra","product-weighing","Product weighing",["weight"],["web-serial","web-hid","native-bridge"]),
 requirement("info-solutions","Info Solutions","information-kiosks","Information kiosks",["display","touch","scanning"],["native-bridge","network-gateway"]),
 requirement("info-solutions","Info Solutions","interactive-displays","Interactive displays",["display","camera"],["native-bridge","network-gateway"]),
 requirement("info-solutions","Info Solutions","document-capture","Document capture",["scanning","camera"],["web-hid","native-bridge"]),
 requirement("info-solutions","Info Solutions","public-terminals","Public terminals",["display","printing","scanning"],["native-bridge","network-gateway"]),
];
export function matchDeviceToComponents(capabilities: DeviceCapability[], transport: DeviceTransport) { const actual = new Set(capabilities); return COMPONENT_DEVICE_REQUIREMENTS.filter(r => r.transports.includes(transport) && r.capabilities.some(c => actual.has(c))).map(r => ({ ...r, matchedCapabilities: r.capabilities.filter(c => actual.has(c)) })); }
export function getBrowserTransportSupport() { const nav = navigator as Navigator & { bluetooth?: unknown; hid?: unknown; serial?: unknown }; const secure=typeof window!=="undefined"&&window.isSecureContext; return [
 { transport:"web-bluetooth" as const, supported:Boolean(nav.bluetooth)&&secure, label:"Bluetooth LE", note:secure?"HTTPS, browser support and explicit device/service permission required.":"A secure HTTPS context is required." },
 { transport:"web-hid" as const, supported:Boolean(nav.hid)&&secure, label:"USB / HID", note:secure?"Supported browser and explicit chooser required; report decoding is model-specific.":"A secure HTTPS context is required." },
 { transport:"web-serial" as const, supported:Boolean(nav.serial)&&secure, label:"USB / Serial", note:secure?"Supported browser and explicit port chooser required; protocol decoding is model-specific.":"A secure HTTPS context is required." },
]; }
