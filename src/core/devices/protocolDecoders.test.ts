import { describe, expect, it } from "vitest";
import { decodeBleCharacteristic, decodeCustomBleCharacteristic, decodeHidReport, decodeNmea0183Line, decodeSerialJsonLine } from "./protocolDecoders";

describe("model/protocol decoders",()=>{
 it("decodes Bluetooth SIG temperature and relative humidity characteristics",()=>{
  const temperature=new DataView(new Int16Array([2500]).buffer);
  const humidity=new DataView(new Uint16Array([5750]).buffer);
  expect(decodeBleCharacteristic("ble-sig-environmental-sensing","00002a6e-0000-1000-8000-00805f9b34fb",temperature)).toMatchObject({metric:"temperature",value:25,unit:"°C"});
  expect(decodeBleCharacteristic("ble-sig-environmental-sensing","00002a6f-0000-1000-8000-00805f9b34fb",humidity)).toMatchObject({metric:"humidity",value:57.5,unit:"%RH"});
 });
 it("decodes Bluetooth Weight Scale IEEE-11073 SFLOAT, not a guessed integer scale",()=>{
  const bytes=new Uint8Array([0,0xe8,0xe3]);
  const value=new DataView(bytes.buffer);
  expect(decodeBleCharacteristic("ble-sig-weight-scale","00002a9d-0000-1000-8000-00805f9b34fb",value)).toMatchObject({metric:"weight",value:10,unit:"kg"});
 });
 it("decodes vendor-specific BLE characteristic data using an explicit model profile",()=>{
  const buffer=new ArrayBuffer(4);new DataView(buffer).setFloat32(0,0.34,true);
  const decoded=decodeCustomBleCharacteristic(new DataView(buffer),{metric:"soil_moisture",unit:"m³/m³",format:"float32le",byteOffset:0,scale:1,offset:0});\n  expect(decoded).toMatchObject({metric:"soil_moisture",unit:"m³/m³"});\n  expect(decoded?.value).toBeCloseTo(0.34,5);
  expect(decodeCustomBleCharacteristic(new DataView(buffer),{metric:"soil_ph",unit:"pH",format:"float32le",byteOffset:0,scale:100,offset:0})).toBeNull();
 });
 it("decodes a configured HID float32 little-endian scale report",()=>{
  const buffer=new ArrayBuffer(4);new DataView(buffer).setFloat32(0,2.5,true);
  expect(decodeHidReport("hid-scale-f32le",new DataView(buffer),{byteOffset:0,multiplier:10,unit:"kg"})).toMatchObject({metric:"weight",value:25,unit:"kg"});
 });
 it("normalises serial JSON relative humidity and rejects invalid units",()=>{
  expect(decodeSerialJsonLine('{"metric":"relative_humidity","value":60,"unit":"%RH"}')).toMatchObject([{metric:"humidity",value:60,unit:"%RH"}]);
  expect(decodeSerialJsonLine('{"metric":"soil_ph","value":18,"unit":"pH"}')).toHaveLength(0);
 });
 it("checksum-validates NMEA RMC and converts knots to metres per second",()=>{
  const decoded=decodeNmea0183Line("$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A");
  expect(decoded.map(x=>x.metric)).toEqual(["latitude","longitude","vehicle_speed"]);
  expect(decoded[0].value).toBeCloseTo(48.1173,4);
  expect(decoded[1].value).toBeCloseTo(11.5166667,4);
  expect(decoded[2].value).toBeCloseTo(11.5235456,3);
  expect(decodeNmea0183Line("$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*00")).toHaveLength(0);
 });
});
