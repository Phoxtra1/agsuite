import type { DeviceCapability, DeviceTransport } from "./types";
import type { ObservationMetric } from "./observationTypes";
export interface DriverProfile {
 id:string; label:string; transport:DeviceTransport; manufacturer:string; model:string;
 capabilities:DeviceCapability[]; metrics:ObservationMetric[]; verifiedStandard:boolean;
 description:string; configuration?:Record<string,unknown>;
}
const BLE_BASE="0000181a-0000-1000-8000-00805f9b34fb";
const BLE_WEIGHT="0000181d-0000-1000-8000-00805f9b34fb";
export const BUILTIN_DRIVER_PROFILES:DriverProfile[]=[
 {id:"ble-sig-environmental-sensing",label:"Bluetooth SIG Environmental Sensing",transport:"web-bluetooth",manufacturer:"Bluetooth SIG standard",model:"Environmental Sensing Service (0x181A)",capabilities:["temperature","humidity","environmental"],metrics:["temperature","humidity"],verifiedStandard:true,description:"Standard Temperature (0x2A6E) and Humidity (0x2A6F) characteristics; not a soil-moisture profile."},
 {id:"ble-sig-weight-scale",label:"Bluetooth SIG Weight Scale",transport:"web-bluetooth",manufacturer:"Bluetooth SIG standard",model:"Weight Scale Service (0x181D)",capabilities:["weight"],metrics:["weight"],verifiedStandard:true,description:"Weight Scale Measurement (0x2A9D), with flag-based lb/kg conversion."},
 {id:"ble-custom-characteristic",label:"Custom BLE manufacturer characteristic",transport:"web-bluetooth",manufacturer:"Manufacturer-defined",model:"Vendor-specific BLE GATT profile",capabilities:["temperature","humidity","soil-moisture","soil-temperature","soil-ph","electrical-conductivity","rainfall","wind","water-level","weight"],metrics:["temperature","humidity","soil_moisture","soil_temperature","soil_ph","electrical_conductivity","rainfall","wind_speed","wind_direction","water_level","weight"],verifiedStandard:false,description:"Configurable service/characteristic UUID, metric, unit, numeric format, byte offset, scale and offset. Configure only from the exact model's manufacturer protocol documentation."},
 {id:"hid-scale-f32le",label:"Configurable HID scale (float32 LE)",transport:"web-hid",manufacturer:"Configurable",model:"Vendor-defined HID report",capabilities:["weight","hid-input"],metrics:["weight"],verifiedStandard:false,description:"Requires the manufacturer's report layout, offset, unit and multiplier."},
 {id:"hid-scale-u16le",label:"Configurable HID scale (uint16 LE)",transport:"web-hid",manufacturer:"Configurable",model:"Vendor-defined HID report",capabilities:["weight","hid-input"],metrics:["weight"],verifiedStandard:false,description:"Requires the manufacturer's report layout, offset, unit and scale factor."},
 {id:"serial-json-lines",label:"Serial JSON Lines",transport:"web-serial",manufacturer:"Configurable",model:"Newline-delimited JSON",capabilities:["serial-data","temperature","humidity","soil-moisture","soil-temperature","soil-ph","electrical-conductivity","rainfall","wind","water-level","weight","location","gnss"],metrics:["temperature","humidity","soil_moisture","soil_temperature","soil_ph","electrical_conductivity","rainfall","wind_speed","wind_direction","water_level","weight","latitude","longitude","vehicle_speed"],verifiedStandard:false,description:"Each line must be JSON with metric, value, unit and optional measuredAt. Metric/unit pairs are validated before routing."},
 {id:"serial-nmea0183",label:"NMEA 0183 RMC/GGA GNSS",transport:"web-serial",manufacturer:"NMEA 0183 compatible",model:"RMC/GGA sentences",capabilities:["location","gnss"],metrics:["latitude","longitude","vehicle_speed"],verifiedStandard:true,description:"Checksum-validated RMC/GGA position and speed. Read-only; no vehicle control."},
 {id:"serial-mavlink-readonly",label:"MAVLink v1/v2 read-only telemetry",transport:"web-serial",manufacturer:"MAVLink ecosystem",model:"MAVLink v1/v2",capabilities:["flight-telemetry","location","gnss"],metrics:["latitude","longitude","aircraft_altitude","aircraft_battery"],verifiedStandard:true,description:"Read-only heartbeat, global position and battery telemetry; no flight-control commands."},
];
export const METRIC_UNITS:Record<ObservationMetric,string[]>={
 temperature:["°C","°F"],humidity:["%RH","%"],soil_moisture:["%","%VWC","m³/m³"],soil_temperature:["°C","°F"],soil_ph:["pH"],electrical_conductivity:["µS/cm","mS/cm","dS/m"],rainfall:["mm","in"],wind_speed:["m/s","km/h","mph"],wind_direction:["°"],water_level:["mm","cm","m"],weight:["g","kg","lb"],barcode_count:["count"],latitude:["°"],longitude:["°"],vehicle_speed:["m/s","km/h","mph"],aircraft_altitude:["m","ft"],aircraft_battery:["%","V"]
};
export function validateMetricValue(metric:ObservationMetric,value:number,unit:string){
 if(!Number.isFinite(value)||!METRIC_UNITS[metric]?.includes(unit))return false;
 const range:Partial<Record<ObservationMetric,[number,number]>>={humidity:[0,100],soil_moisture:unit==="m³/m³"?[0,1]:[0,100],soil_ph:[0,14],wind_direction:[0,360],latitude:[-90,90],longitude:[-180,180],aircraft_battery:unit==="%"?[0,100]:[0,100],rainfall:[0,100000],wind_speed:[0,150],weight:[0,1000000],vehicle_speed:[0,1500],aircraft_altitude:[-1000,100000],water_level:[0,100000],electrical_conductivity:[0,1000000],barcode_count:[0,100000000]};
 const r=range[metric];return !r||(value>=r[0]&&value<=r[1]);
}
