import type { ObservationMetric } from "./observationTypes";
import { validateMetricValue } from "./driverProfiles";
export interface DecodedMeasurement { metric:ObservationMetric; value:number; unit:string; measuredAt?:string; metadata?:Record<string,string|number|boolean|null>; }
export function decodeBleCharacteristic(profileId:string,characteristicUuid:string,view:DataView):DecodedMeasurement|null {
 const uuid=characteristicUuid.toLowerCase();
 let item:DecodedMeasurement|null=null;
 if(profileId==="ble-sig-environmental-sensing"&&uuid.endsWith("2a6e")) item={metric:"temperature",value:view.byteLength>=2?view.getInt16(0,true)/100:NaN,unit:"°C"};
 if(profileId==="ble-sig-environmental-sensing"&&uuid.endsWith("2a6f")) item={metric:"humidity",value:view.byteLength>=2?view.getUint16(0,true)/100:NaN,unit:"%RH"};
 if(profileId==="ble-sig-weight-scale"&&uuid.endsWith("2a9d")&&view.byteLength>=3){const flags=view.getUint8(0);const raw=view.getUint16(1,true)/100;item={metric:"weight",value:flags&1?raw*0.45359237:raw,unit:"kg",metadata:{sourceUnit:flags&1?"lb":"kg"}};}
 return item&&validateMetricValue(item.metric,item.value,item.unit)?item:null;
}
export function decodeHidReport(profileId:string,view:DataView,config:Record<string,unknown>):DecodedMeasurement|null {
 const offset=Number(config.byteOffset??0),multiplier=Number(config.multiplier??1),unit=String(config.unit??"kg");
 if(!Number.isInteger(offset)||offset<0||!Number.isFinite(multiplier)||multiplier<=0)return null;
 let raw:number;
 if(profileId==="hid-scale-f32le"){if(view.byteLength<offset+4)return null;raw=view.getFloat32(offset,true);}
 else if(profileId==="hid-scale-u16le"){if(view.byteLength<offset+2)return null;raw=view.getUint16(offset,true);}
 else return null;
 const value=raw*multiplier;return validateMetricValue("weight",value,unit)?{metric:"weight",value,unit,metadata:{decoder:profileId,byteOffset:offset,multiplier}}:null;
}
export function decodeSerialJsonLine(line:string):DecodedMeasurement[]{
 let data:any;try{data=JSON.parse(line);}catch{return [];}
 if(!data||typeof data!=="object"||Array.isArray(data)||typeof data.metric!=="string"||typeof data.value!=="number"||typeof data.unit!=="string")return [];
 const metric=data.metric as ObservationMetric;const value=data.value,unit=data.unit;
 if(!validateMetricValue(metric,value,unit))return [];
 const measuredAt=typeof data.measuredAt==="string"?data.measuredAt:typeof data.measured_at==="string"?data.measured_at:undefined;
 return [{metric,value,unit,measuredAt,metadata:{...(typeof data.sequence==="number"?{sequence:data.sequence}:{}),...(typeof data.sensorId==="string"?{sensorId:data.sensorId.slice(0,100)}:{})}}];
}
function nmeaChecksumValid(sentence:string){const star=sentence.lastIndexOf("*");if(!sentence.startsWith("$")||star<2||star+3!==sentence.length)return false;const expected=Number.parseInt(sentence.slice(star+1),16);if(!Number.isInteger(expected))return false;let actual=0;for(let i=1;i<star;i++)actual^=sentence.charCodeAt(i);return actual===expected;}
function nmeaCoordinate(raw:string|undefined,hemisphere:string|undefined,max:number):number|null{if(!raw||!hemisphere)return null;const n=Number(raw);if(!Number.isFinite(n)||n<0)return null;const degrees=Math.floor(n/100),minutes=n-degrees*100;if(minutes>=60||degrees>max||(degrees===max&&minutes>0))return null;const sign=hemisphere==="S"||hemisphere==="W"?-1:hemisphere==="N"||hemisphere==="E"?1:0;return sign?sign*(degrees+minutes/60):null;}
export function decodeNmea0183Line(line:string):DecodedMeasurement[]{const s=line.trim();if(!nmeaChecksumValid(s))return [];const f=s.slice(1,s.lastIndexOf("*")).split(",");const type=f[0]?.slice(-3);let lat:number|null=null,lon:number|null=null,speed:number|null=null;
 if(type==="RMC"&&f[2]==="A"){lat=nmeaCoordinate(f[3],f[4],90);lon=nmeaCoordinate(f[5],f[6],180);const knots=Number(f[7]);if(f[7]&&Number.isFinite(knots)&&knots>=0)speed=knots*0.514444;}
 else if(type==="GGA"&&Number(f[6])>0){lat=nmeaCoordinate(f[2],f[3],90);lon=nmeaCoordinate(f[4],f[5],180);}else return [];
 if(lat===null||lon===null)return [];const out:DecodedMeasurement[]=[{metric:"latitude",value:lat,unit:"°"},{metric:"longitude",value:lon,unit:"°"}];if(speed!==null)out.push({metric:"vehicle_speed",value:speed,unit:"m/s"});return out;
}
const MAVLINK_EXTRA_CRC:Record<number,number>={0:50,1:124,24:24,30:39,33:104,74:20,147:154,242:104};
function x25(data:Uint8Array,initial=0xffff){let crc=initial;for(const byte of data){let tmp=byte^(crc&0xff);tmp^=(tmp<<4)&0xff;crc=((crc>>8)^(tmp<<8)^(tmp<<3)^(tmp>>4))&0xffff;}return crc;}
export interface MavlinkFrame{version:1|2;messageId:number;payload:Uint8Array;sequence:number;systemId:number;componentId:number;}
export function parseMavlinkFrames(buffer:Uint8Array):{frames:MavlinkFrame[];remaining:Uint8Array}{
 const frames:MavlinkFrame[]=[];let i=0;
 while(i<buffer.length){const magic=buffer[i];if(magic!==0xfe&&magic!==0xfd){i++;continue;}const v2=magic===0xfd,header=v2?10:6;if(buffer.length-i<header)break;const len=buffer[i+1],signed=v2&&(buffer[i+2]&1)!==0,total=header+len+2+(signed?13:0);if(buffer.length-i<total)break;
 const sequence=buffer[i+(v2?4:2)],systemId=buffer[i+(v2?5:3)],componentId=buffer[i+(v2?6:4)],messageId=v2?buffer[i+7]|(buffer[i+8]<<8)|(buffer[i+9]<<16):buffer[i+5];
 const crcStart=i+1,crcEnd=i+header+len,crcData=buffer.slice(crcStart,crcEnd);const extra=MAVLINK_EXTRA_CRC[messageId];
 if(extra!==undefined){const crc=x25(crcData);let tmp=extra^(crc&0xff);tmp^=(tmp<<4)&0xff;const calculated=((crc>>8)^(tmp<<8)^(tmp<<3)^(tmp>>4))&0xffff;const offset=i+header+len;const received=buffer[offset]|(buffer[offset+1]<<8);if(calculated===received)frames.push({version:v2?2:1,messageId,payload:buffer.slice(i+header,i+header+len),sequence,systemId,componentId});}
 i+=total;
 }
 return {frames,remaining:buffer.slice(i)};
}
export function decodeMavlinkFrame(frame:{messageId:number;payload:Uint8Array}):DecodedMeasurement[]{
 const v=new DataView(frame.payload.buffer,frame.payload.byteOffset,frame.payload.byteLength);
 if(frame.messageId===33&&v.byteLength>=28){const lat=v.getInt32(4,true)/1e7,lon=v.getInt32(8,true)/1e7,alt=v.getInt32(12,true)/1000;const out:DecodedMeasurement[]=[];if(validateMetricValue("latitude",lat,"°"))out.push({metric:"latitude",value:lat,unit:"°"});if(validateMetricValue("longitude",lon,"°"))out.push({metric:"longitude",value:lon,unit:"°"});if(validateMetricValue("aircraft_altitude",alt,"m"))out.push({metric:"aircraft_altitude",value:alt,unit:"m"});return out;}
 if(frame.messageId===1&&v.byteLength>=31){const voltage=v.getUint16(14,true)/1000,remaining=v.getInt8(30);const out:DecodedMeasurement[]=[];if(voltage>0)out.push({metric:"aircraft_battery",value:voltage,unit:"V"});if(remaining>=0)out.push({metric:"aircraft_battery",value:remaining,unit:"%"});return out;}
 return [];
}
