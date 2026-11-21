import { useEffect, useMemo, useState } from "react";
import { loadComponentDeviceData, subscribeToComponentDeviceData } from "./componentSubscriptions";
import type { AppId, DeviceObservation, ObservationMetric } from "./observationTypes";
export function useComponentDeviceData(ownerId:string|undefined,appId:AppId,componentId:string){
 const [observations,setObservations]=useState<DeviceObservation[]>([]);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;setObservations([]);setError(null);if(!ownerId)return;
 void loadComponentDeviceData({ownerId,appId,componentId}).then(items=>{if(active)setObservations(items);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load device observations.");});
 const unsubscribe=subscribeToComponentDeviceData({ownerId,appId,componentId,onObservation:item=>setObservations(current=>[...current.filter(x=>x.eventId!==item.eventId),item].sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt)).slice(-300)),onError:e=>setError(e.message)});
 return()=>{active=false;unsubscribe();};
 },[ownerId,appId,componentId]);
 const latestByMetric=useMemo(()=>{const latest=new Map<ObservationMetric,DeviceObservation>();for(const item of observations){const prior=latest.get(item.metric);if(!prior||Date.parse(item.measuredAt)>=Date.parse(prior.measuredAt))latest.set(item.metric,item);}return latest;},[observations]);
 return {observations,latestByMetric,error};
}
