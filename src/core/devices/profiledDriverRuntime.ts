import { decodeBleCharacteristic, decodeCustomBleCharacteristic, decodeHidReport, decodeNmea0183Line, decodeSerialJsonLine, parseMavlinkFrames, decodeMavlinkFrame, type DecodedMeasurement } from "./protocolDecoders";
import type { DriverProfile } from "./driverProfiles";
import type { DeviceRegistration } from "./observationTypes";

export interface ConnectedDriver { close:()=>Promise<void>; detail:string; }
export async function discoverForProfile(profile:DriverProfile,config:Record<string,unknown>={}):Promise<{browserDevice:any;deviceKey:string;name:string;metadata:Record<string,unknown>}> {
 if(profile.transport==="web-bluetooth"){
  const api=(navigator as any).bluetooth;if(!api?.requestDevice)throw new Error("Web Bluetooth is not supported in this browser.");
  const services=profile.id==="ble-sig-environmental-sensing"||profile.id==="ble-custom-characteristic"?["environmental_sensing"]:["weight_scale"];
  const customService=String(config.serviceUuid||"").trim();
  const optionalServices=profile.id==="ble-custom-characteristic"?(customService?[customService]:[]):services;
  const filters=profile.id==="ble-custom-characteristic"?(customService?[{services:[customService]}]:[{acceptAllDevices:true}]):[{services}];
  const device=await api.requestDevice({filters,optionalServices});
  return {browserDevice:device,deviceKey:"ble:"+device.id,name:device.name||profile.label,metadata:{browserId:device.id}};
 }
 if(profile.transport==="web-hid"){
  const api=(navigator as any).hid;if(!api?.requestDevice)throw new Error("WebHID is not supported in this browser.");
  const [device]=await api.requestDevice({filters:[]});if(!device)throw new Error("No HID device selected.");
  return {browserDevice:device,deviceKey:"hid:"+device.vendorId+"-"+device.productId,name:device.productName||profile.label,metadata:{vendorId:device.vendorId,productId:device.productId,manufacturer:device.manufacturerName}};
 }
 if(profile.transport==="web-serial"){
  const api=(navigator as any).serial;if(!api?.requestPort)throw new Error("Web Serial is not supported in this browser.");
  const port=await api.requestPort();const info=port.getInfo?.()||{};
  return {browserDevice:port,deviceKey:"serial:"+String(info.usbVendorId||"usb")+"-"+String(info.usbProductId||"serial"),name:profile.label,metadata:info};
 }
 throw new Error("This profile requires a native bridge or authenticated network gateway, not a browser-local adapter.");
}
const metricCapabilities:Record<string,string[]>={temperature:["temperature","environmental"],humidity:["humidity","environmental"],soil_moisture:["soil-moisture"],soil_temperature:["soil-temperature"],soil_ph:["soil-ph"],electrical_conductivity:["electrical-conductivity"],rainfall:["rainfall"],wind_speed:["wind"],wind_direction:["wind"],water_level:["water-level"],weight:["weight"],barcode_count:["barcode","qr-code","inventory-count"],latitude:["location","gnss","flight-telemetry"],longitude:["location","gnss","flight-telemetry"],vehicle_speed:["gnss"],aircraft_altitude:["flight-telemetry"],aircraft_battery:["flight-telemetry"]};
function authorised(device:DeviceRegistration,m:DecodedMeasurement){return device.capabilities.some(cap=>metricCapabilities[m.metric]?.includes(cap));}
export async function connectProfiledDevice(device:DeviceRegistration,browserDevice:any,profile:DriverProfile,onMeasurement:(m:DecodedMeasurement)=>void,onDisconnected?:(error?:unknown)=>void):Promise<ConnectedDriver>{
 if(device.transport!==profile.transport)throw new Error("Selected driver protocol does not match the registered device transport.");
 if(profile.transport==="web-bluetooth"){
  const gatt=browserDevice?.gatt;if(!gatt)throw new Error("Selected Bluetooth device has no GATT interface.");
  const server=await gatt.connect();const subscriptions:Array<{characteristic:any;listener:(e:any)=>void}>=[];
  const customService=String(device.driverConfig.serviceUuid||"").trim();
  const customCharacteristic=String(device.driverConfig.characteristicUuid||"").trim();
  const specs=profile.id==="ble-sig-environmental-sensing"?[
   ["environmental_sensing","temperature"],["environmental_sensing","humidity"]
  ]:profile.id==="ble-custom-characteristic"?[[customService,customCharacteristic]]:[["weight_scale","weight"]];
  for(const [serviceShort,metric] of specs){
   const serviceUuid=profile.id==="ble-custom-characteristic"?customService:serviceShort==="environmental_sensing"?"0000181a-0000-1000-8000-00805f9b34fb":"0000181d-0000-1000-8000-00805f9b34fb";
   const characteristicUuid=profile.id==="ble-custom-characteristic"?customCharacteristic:metric==="temperature"?"00002a6e-0000-1000-8000-00805f9b34fb":metric==="humidity"?"00002a6f-0000-1000-8000-00805f9b34fb":"00002a9d-0000-1000-8000-00805f9b34fb";
   try{const svc=await server.getPrimaryService(serviceUuid);const characteristic=await svc.getCharacteristic(characteristicUuid);
    const listener=(event:any)=>{const view=event?.target?.value as DataView|undefined;if(!view)return;const decoded=profile.id==="ble-custom-characteristic"?decodeCustomBleCharacteristic(view,device.driverConfig):decodeBleCharacteristic(profile.id,characteristicUuid,view);if(decoded&&authorised(device,decoded))onMeasurement(decoded);};
    characteristic.addEventListener("characteristicvaluechanged",listener);await characteristic.startNotifications();subscriptions.push({characteristic,listener});
   }catch{/* The model may expose only a subset of standard characteristics. */}
  }
  if(!subscriptions.length){gatt.disconnect();throw new Error("No configured standard BLE characteristics were available on this device.");}
  const onGattDisconnected=()=>onDisconnected?.(new Error("Bluetooth device disconnected."));
  browserDevice.addEventListener("gattserverdisconnected",onGattDisconnected);
  return {detail:"BLE GATT notifications active for "+subscriptions.length+" standard characteristics.",close:async()=>{browserDevice.removeEventListener("gattserverdisconnected",onGattDisconnected);for(const s of subscriptions){s.characteristic.removeEventListener("characteristicvaluechanged",s.listener);try{await s.characteristic.stopNotifications();}catch{}}if(gatt.connected)gatt.disconnect();}};
 }
 if(profile.transport==="web-hid"){
  await browserDevice.open();const listener=(event:any)=>{const decoded=decodeHidReport(profile.id,event.data as DataView,device.driverConfig);if(decoded&&authorised(device,decoded))onMeasurement(decoded);};
  browserDevice.addEventListener("inputreport",listener);
  const hidApi=(navigator as any).hid;const onHidDisconnect=(event:any)=>{if(event?.device===browserDevice)onDisconnected?.(new Error("HID device disconnected."));};
  hidApi?.addEventListener?.("disconnect",onHidDisconnect);
  return {detail:"HID input reports active using "+profile.label+".",close:async()=>{browserDevice.removeEventListener("inputreport",listener);hidApi?.removeEventListener?.("disconnect",onHidDisconnect);if(browserDevice.opened)await browserDevice.close();}};
 }
 if(profile.transport==="web-serial"){
  await browserDevice.open({baudRate:Number(device.driverConfig.baudRate||9600)});if(!browserDevice.readable)throw new Error("Serial port has no readable stream.");
  let stopped=false;const reader=browserDevice.readable.getReader();const decoder=new TextDecoder();let pending="",mavBuffer=new Uint8Array();
  const task=(async()=>{try{while(!stopped){const {value,done}=await reader.read();if(done)break;
   if(profile.id==="serial-mavlink-readonly"){const merged=new Uint8Array(mavBuffer.length+value.length);merged.set(mavBuffer);merged.set(value,mavBuffer.length);const parsed=parseMavlinkFrames(merged);mavBuffer=parsed.remaining;for(const frame of parsed.frames){for(const m of decodeMavlinkFrame(frame)){if(authorised(device,m))onMeasurement(m);}}continue;}
   pending+=decoder.decode(value,{stream:true});if(pending.length>8192){pending="";onDisconnected?.(new Error("Serial device exceeded the maximum line buffer."));break;}const lines=pending.split(/\r?\n/);pending=lines.pop()||"";
   for(const line of lines){const decoded=profile.id==="serial-nmea0183"?decodeNmea0183Line(line):decodeSerialJsonLine(line);for(const m of decoded){if(authorised(device,m))onMeasurement(m);}}
  }}catch(error){if(!stopped)onDisconnected?.(error);}finally{try{reader.releaseLock();}catch{}}})();
  return {detail:profile.id==="serial-nmea0183"?"NMEA 0183 checksum-validated RMC/GGA reader active.":profile.id==="serial-mavlink-readonly"?"MAVLink v1/v2 read-only telemetry parser active.":"Serial JSON-lines decoder active.",close:async()=>{stopped=true;try{await reader.cancel();}catch{}await task.catch(()=>undefined);try{await browserDevice.close();}catch{}}};
 }
 throw new Error("No browser driver exists for this protocol.");
}
