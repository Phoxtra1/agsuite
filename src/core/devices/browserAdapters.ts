import { publishDeviceData, publishDeviceError, registerActiveConnection } from "./deviceManager";
import type { DeviceCapability, DeviceTransport } from "./types";
export interface DiscoveredBrowserDevice { id: string; name: string; transport: DeviceTransport; capabilities: DeviceCapability[]; manufacturer?: string; model?: string; metadata?: Record<string, unknown>; }
const key = (transport: string, id: string) => transport + ":" + id;
export async function discoverBluetoothDevice(): Promise<{device: any; record: DiscoveredBrowserDevice}> {
 const api = (navigator as any).bluetooth; if (!api?.requestDevice) throw new Error("Web Bluetooth is not supported.");
 const device = await api.requestDevice({ acceptAllDevices:true, optionalServices:[] });
 return { device, record:{ id:key("ble",device.id), name:device.name || "Bluetooth device", transport:"web-bluetooth", capabilities:[], metadata:{browserDeviceId:device.id} } };
}
export async function connectBluetooth(device: any) {
 if (!device?.gatt) throw new Error("The selected Bluetooth device does not expose GATT.");
 await device.gatt.connect();
 const id=key("ble",device.id);
 const disconnected=()=>publishDeviceError(id,new Error("Bluetooth GATT disconnected."));
 device.addEventListener("gattserverdisconnected",disconnected);
 registerActiveConnection(id,"web-bluetooth",async()=>{device.removeEventListener("gattserverdisconnected",disconnected); if(device.gatt.connected) device.gatt.disconnect();});
}
export async function discoverHidDevice() { const api=(navigator as any).hid; if(!api?.requestDevice) throw new Error("WebHID is not supported."); const [device]=await api.requestDevice({filters:[]}); if(!device) throw new Error("No HID device selected."); return {device,record:{id:key("hid",device.productId+"-"+device.vendorId),name:device.productName || "HID device",transport:"web-hid" as const,capabilities:["hid-input"] as DeviceCapability[],manufacturer:device.manufacturerName,metadata:{vendorId:device.vendorId,productId:device.productId}}}; }
export async function connectHid(device:any) { await device.open(); const id=key("hid",device.productId+"-"+device.vendorId); const handler=(event:any)=>publishDeviceData(id,{reportId:event.reportId,bytes:Array.from(new Uint8Array(event.data.buffer))}); device.addEventListener("inputreport",handler); registerActiveConnection(id,"web-hid",async()=>{device.removeEventListener("inputreport",handler); if(device.opened) await device.close();}); }
export async function discoverSerialPort() { const api=(navigator as any).serial; if(!api?.requestPort) throw new Error("Web Serial is not supported."); const port=await api.requestPort(); const info=port.getInfo?.() || {}; return {port,record:{id:key("serial",(info.usbVendorId || "usb")+"-"+(info.usbProductId || "serial")),name:"USB / serial device",transport:"web-serial" as const,capabilities:["serial-data"] as DeviceCapability[],metadata:info}}; }
export async function connectSerial(port:any,baudRate=9600) {
 await port.open({baudRate}); const info=port.getInfo?.() || {}; const id=key("serial",(info.usbVendorId || "usb")+"-"+(info.usbProductId || "serial")); let stopped=false;
 const task=(async()=>{const decoder=new TextDecoderStream(); const closed=port.readable.pipeTo(decoder.writable).catch(()=>undefined); const reader=decoder.readable.getReader(); let buffer=""; try { while(!stopped){const {value,done}=await reader.read(); if(done) break; buffer+=value; const lines=buffer.split(/\r?\n/); buffer=lines.pop() || ""; for(const line of lines){const text=line.trim(); if(!text) continue; try{publishDeviceData(id,JSON.parse(text));}catch{publishDeviceData(id,{raw:text,format:"text-line"});}}}}catch(error){if(!stopped) publishDeviceError(id,error);}finally{reader.releaseLock(); await closed;}})();
 registerActiveConnection(id,"web-serial",async()=>{stopped=true; try{await port.close();}finally{await task.catch(()=>undefined);}});
}
