import { supabase } from "@/integrations/supabase/client";
import { publishDeviceData, publishDeviceError } from "./deviceManager";
import { METRIC_UNITS, validateMetricValue } from "./driverProfiles";
import type { DeviceRegistration, DeviceObservation, ObservationMetric } from "./observationTypes";
import type { DeviceCapability } from "./types";
const capabilityMetrics:Record<string,ObservationMetric[]>={"temperature":["temperature"],"humidity":["humidity"],"soil-moisture":["soil_moisture"],"soil-temperature":["soil_temperature"],"soil-ph":["soil_ph"],"electrical-conductivity":["electrical_conductivity"],"rainfall":["rainfall"],"wind":["wind_speed","wind_direction"],"water-level":["water_level"],"weight":["weight"],"barcode":["barcode_count"],"qr-code":["barcode_count"],"location":["latitude","longitude"],"gnss":["latitude","longitude","vehicle_speed"],"flight-telemetry":["latitude","longitude","aircraft_altitude","aircraft_battery"],"environmental":["temperature","humidity"],"inventory-count":["barcode_count"],"point-of-sale":["weight","barcode_count"]};
export function deviceCanEmitMetric(device:DeviceRegistration,metric:ObservationMetric){return device.capabilities.some(cap=>capabilityMetrics[cap]?.includes(metric));}
export async function routeDeviceObservation(device:DeviceRegistration,decoded:{metric:ObservationMetric;value:number;unit:string;measuredAt?:string;metadata?:Record<string,string|number|boolean|null>},agroclimateDeviceToken?:string){
 if(device.status!=="connected")throw new Error("Only an actively connected device can publish observations.");
 if(!deviceCanEmitMetric(device,decoded.metric))throw new Error("This device is not authorised for the requested metric/capability.");
 if(!validateMetricValue(decoded.metric,decoded.value,decoded.unit))throw new Error("Measurement failed metric/unit/range validation.");
 const measuredAt=decoded.measuredAt&&Number.isFinite(Date.parse(decoded.measuredAt))?new Date(decoded.measuredAt).toISOString():new Date().toISOString();
 if(Date.parse(measuredAt)>Date.now()+300000||Date.parse(measuredAt)<Date.now()-365*24*60*60*1000)throw new Error("Measurement timestamp is outside the accepted time window.");
 if(device.appId==="agroclimate"&&(!agroclimateDeviceToken||agroclimateDeviceToken.length<32))throw new Error("A valid AgroClimate device credential is required for delivery to the live AgroClimate component.");
 const observation:DeviceObservation={eventId:crypto.randomUUID(),deviceId:device.id,ownerId:device.ownerId,appId:device.appId,componentId:device.componentId,metric:decoded.metric,value:decoded.value,unit:decoded.unit,measuredAt,receivedAt:new Date().toISOString(),transport:device.transport,manufacturer:device.manufacturer,model:device.model,quality:"valid",metadata:decoded.metadata};
 const {data,error}=await supabase.functions.invoke("amineva-device-ingest",{body:{device_id:observation.deviceId,event_id:observation.eventId,app_id:observation.appId,component_id:observation.componentId,metric:observation.metric,value:observation.value,unit:observation.unit,measured_at:observation.measuredAt,metadata:observation.metadata||{},agroclimate_device_token:agroclimateDeviceToken||null}});
 if(error||data?.accepted!==true){const reason=data?.error||error?.message||"Secure device observation was not accepted.";publishDeviceError(device.id,reason);throw new Error(reason);}
 publishDeviceData(device.id,{...observation,delivery:data.delivery||"central"});return observation;
}
export function getMetricsForCapabilities(caps:DeviceCapability[]){return [...new Set(caps.flatMap(c=>capabilityMetrics[c]||[]))];}
export function getAllowedUnits(metric:ObservationMetric){return METRIC_UNITS[metric]||[];}
