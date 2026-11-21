import { useEffect, useState } from "react";
import { subscribeToComponentDeviceData } from "./componentSubscriptions";
import type { AppId, DeviceObservation } from "./observationTypes";
export function useComponentDeviceData(ownerId:string|undefined,appId:AppId,componentId:string){
 const [observations,setObservations]=useState<DeviceObservation[]>([]);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{setObservations([]);setError(null);if(!ownerId)return;
 return subscribeToComponentDeviceData({ownerId,appId,componentId,onObservation:item=>setObservations(current=>[...current.filter(x=>x.eventId!==item.eventId),item].sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt)).slice(-300)),onError:e=>setError(e.message)});
 },[ownerId,appId,componentId]);
 return {observations,latestByMetric:Object.fromEntries([...new Map(observations.map(o=>[o.metric,o])).entries()]),error};
}
