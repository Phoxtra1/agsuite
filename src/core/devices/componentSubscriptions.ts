import { supabase } from "@/integrations/supabase/client";
import type { AppId, DeviceObservation } from "./observationTypes";
export function subscribeToComponentDeviceData(input:{ownerId:string;appId:AppId;componentId:string;onObservation:(value:DeviceObservation)=>void;onError?:(error:Error)=>void}){
 const {ownerId,appId,componentId,onObservation,onError}=input;
 const channel=supabase.channel("device-route:"+ownerId+":"+appId+":"+componentId)
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"amineva_device_observations",filter:"owner_id=eq."+ownerId},payload=>{
  const row=payload.new as any;if(row.app_id!==appId||row.component_id!==componentId)return;
  if(!Number.isFinite(Number(row.value)))return;
  onObservation({eventId:row.event_id,deviceId:row.device_id,ownerId:row.owner_id,appId:row.app_id,componentId:row.component_id,metric:row.metric,value:Number(row.value),unit:row.unit,measuredAt:row.measured_at,receivedAt:row.received_at,transport:row.transport,manufacturer:row.manufacturer,model:row.model,quality:row.quality,metadata:row.metadata||{}});
 }).subscribe((status)=>{if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")onError?.(new Error("Device data realtime subscription failed: "+status));});
 return ()=>{void supabase.removeChannel(channel);};
}
