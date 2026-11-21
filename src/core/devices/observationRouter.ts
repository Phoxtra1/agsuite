import { supabase } from "@/integrations/supabase/client";
import { publishDeviceData, publishDeviceError } from "./deviceManager";
import { METRIC_UNITS, validateMetricValue } from "./driverProfiles";
import type { DeviceRegistration, DeviceObservation, ObservationMetric } from "./observationTypes";
import type { DeviceCapability } from "./types";
const capabilityMetrics:Record<string,ObservationMetric[]>={"temperature":["temperature"],"humidity":["humidity"],"soil-moisture":["soil_moisture"],"soil-temperature":["soil_temperature"],"soil-ph":["soil_ph"],"electrical-conductivity":["electrical_conductivity"],"rainfall":["rainfall"],"wind":["wind_speed","wind_direction"],"water-level":["water_level"],"weight":["weight"],"barcode":["barcode_count"],"qr-code":["barcode_count"],"location":["latitude","longitude"],"gnss":["latitude","longitude","vehicle_speed"],"flight-telemetry":["latitude","longitude","aircraft_altitude","aircraft_battery"],"environmental":["temperature","humidity"],"inventory-count":["barcode_count"],"point-of-sale":["weight","barcode_count"]};
type PendingRoute={device:DeviceRegistration;observation:DeviceObservation;token?:string};
const pending=new Map<string,PendingRoute>();
let retryTimer:ReturnType<typeof setTimeout>|undefined;
let retryAttempt=0;
function scheduleRetry(){if(retryTimer||typeof window==="undefined")return;const delay=Math.min(30000,1000*Math.pow(2,retryAttempt++));retryTimer=setTimeout(()=>{retryTimer=undefined;void flushPendingDeviceRoutes();},delay);}
export function deviceCanEmitMetric(device:DeviceRegistration,metric:ObservationMetric){return device.capabilities.some(cap=>capabilityMetrics[cap]?.includes(metric));}
async function deliver(route:PendingRoute){
 const o=route.observation;
 const {data,error}=await supabase.functions.invoke("amineva-device-ingest",{body:{device_id:o.deviceId,event_id:o.eventId,app_id:o.appId,component_id:o.componentId,metric:o.metric,value:o.value,unit:o.unit,measured_at:o.measuredAt,metadata:o.metadata||{},agroclimate_device_token:route.token||null}});
 if(error||data?.accepted!==true){
  const status=(error as any)?.context?.status;
  if(status&&status>=400&&status<500&&status!==429)pending.delete(o.eventId);
  else pending.set(o.eventId,route);
  throw new Error(data?.error||error?.message||"Secure device observation delivery failed.");
 }
 pending.delete(o.eventId);
 publishDeviceData(o.deviceId,{...o,delivery:data.delivery||"central-realtime"});
}
export async function routeDeviceObservation(device:DeviceRegistration,decoded:{metric:ObservationMetric;value:number;unit:string;measuredAt?:string;metadata?:Record<string,string|number|boolean|null>},agroclimateDeviceToken?:string){
 if(device.status!=="connected")throw new Error("Only an actively connected device can publish observations.");
 if(!deviceCanEmitMetric(device,decoded.metric))throw new Error("This device is not authorised for the requested metric/capability.");
 if(!validateMetricValue(decoded.metric,decoded.value,decoded.unit))throw new Error("Measurement failed metric/unit/range validation.");
 if(device.appId==="agroclimate"&&(!agroclimateDeviceToken||agroclimateDeviceToken.length<32))throw new Error("A valid AgroClimate device credential is required for delivery to the live AgroClimate component.");
 if(decoded.measuredAt&&(!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$/.test(decoded.measuredAt)||!Number.isFinite(Date.parse(decoded.measuredAt))))throw new Error("Device measurement timestamp must be timezone-aware ISO 8601.");
 const measuredAt=decoded.measuredAt?new Date(decoded.measuredAt).toISOString():new Date().toISOString();
 if(Date.parse(measuredAt)>Date.now()+300000||Date.parse(measuredAt)<Date.now()-365*24*60*60*1000)throw new Error("Measurement timestamp is outside the accepted time window.");
 const observation:DeviceObservation={eventId:crypto.randomUUID(),deviceId:device.id,ownerId:device.ownerId,appId:device.appId,componentId:device.componentId,metric:decoded.metric,value:decoded.value,unit:decoded.unit,measuredAt,receivedAt:new Date().toISOString(),transport:device.transport,manufacturer:device.manufacturer,model:device.model,quality:"valid",metadata:decoded.metadata};
 const route={device,observation,token:agroclimateDeviceToken};pending.set(observation.eventId,route);
 try{await deliver(route);}catch(error){publishDeviceError(device.id,error);throw error;}
 return observation;
}
export async function flushPendingDeviceRoutes(){for(const route of [...pending.values()]){try{await deliver(route);}catch{/* Retained for the next online retry. */}}}
if(typeof window!=="undefined")window.addEventListener("online",()=>{void flushPendingDeviceRoutes();});
export function getPendingDeviceRouteCount(){return pending.size;}
export function getAllowedUnits(metric:ObservationMetric){return METRIC_UNITS[metric]||[];}
