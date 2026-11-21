import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={ "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const allowedUnits:Record<string,string[]>={temperature:["°C","°F","C","F"],humidity:["%RH","%"],soil_moisture:["%","%VWC","m³/m³"],soil_temperature:["°C","°F"],soil_ph:["pH"],electrical_conductivity:["µS/cm","mS/cm","dS/m"],rainfall:["mm","in"],wind_speed:["m/s","km/h","mph"],wind_direction:["°"],water_level:["mm","cm","m"],weight:["g","kg","lb"],barcode_count:["count"],latitude:["°"],longitude:["°"],vehicle_speed:["m/s","km/h","mph"],aircraft_altitude:["m","ft"],aircraft_battery:["%","V"]};
const capMetrics:Record<string,string[]>={temperature:["temperature"],humidity:["humidity"],"soil-moisture":["soil_moisture"],"soil-temperature":["soil_temperature"],"soil-ph":["soil_ph"],"electrical-conductivity":["electrical_conductivity"],rainfall:["rainfall"],wind:["wind_speed","wind_direction"],"water-level":["water_level"],weight:["weight"],barcode:["barcode_count"],"qr-code":["barcode_count"],location:["latitude","longitude"],gnss:["latitude","longitude","vehicle_speed"],"flight-telemetry":["latitude","longitude","aircraft_altitude","aircraft_battery"],environmental:["temperature","humidity"],"inventory-count":["barcode_count"],"point-of-sale":["weight","barcode_count"]};
const componentMetrics:Record<string,string[]>={"agroforecast":["temperature","humidity","rainfall","wind_speed","wind_direction"],"agrorisk":["temperature","soil_moisture","soil_temperature","soil_ph","electrical_conductivity","rainfall","water_level"],"agro-inventory":["weight","barcode_count"],"market-link":["weight"],"agtrans":["latitude","longitude","vehicle_speed"],"aerial-console":["latitude","longitude","aircraft_altitude","aircraft_battery"],"farm-handler":["latitude","longitude"],"post-harvest":["temperature","humidity"],"stock-control":["weight","barcode_count"],"sales-checkout":["weight","barcode_count"],"receipts-labels":["barcode_count"],"product-weighing":["weight"],"document-capture":["barcode_count"],"public-terminals":["barcode_count"]};
const targetComponent:Record<string,string>={"weather-observations":"agroforecast","agro-forecast":"agroforecast","soil-monitoring":"agrorisk","agro-risk":"agrorisk","agro-inventory":"agro-inventory","market-link":"market-link","agtrans":"agtrans","aerial-console":"aerial-console","farm-handler":"farm-handler","post-harvest":"post-harvest"};
function plausible(metric:string,value:number,unit:string){if(!Number.isFinite(value)||!allowedUnits[metric]?.includes(unit))return false;const ranges:Record<string,[number,number]>={humidity:[0,100],soil_moisture:unit==="m³/m³"?[0,1]:[0,100],soil_ph:[0,14],wind_direction:[0,360],latitude:[-90,90],longitude:[-180,180],aircraft_battery:unit==="%"?[0,100]:[0,100],rainfall:[0,100000],wind_speed:[0,150],weight:[0,1000000],vehicle_speed:[0,1500],aircraft_altitude:[-1000,100000],water_level:[0,100000],electrical_conductivity:[0,1000000],barcode_count:[0,100000000]};const r=ranges[metric];return !r||(value>=r[0]&&value<=r[1]);}
const mapMetric=(metric:string)=>metric==="humidity"?"relative_humidity":metric;
async function sendAgroClimate(url:string,key:string,token:string,body:Record<string,unknown>,path="agroclimate-device-gateway"){
 const response=await fetch(url.replace(/\/$/,"")+"/functions/v1/"+path,{method:"POST",headers:{"Content-Type":"application/json","apikey":key,"x-device-token":token},body:JSON.stringify(body)});
 const result=await response.json().catch(()=>({error:"AgroClimate gateway returned a non-JSON response"}));
 if(!response.ok||result?.accepted!==true)throw new Error(typeof result?.error==="string"?result.error:"AgroClimate gateway rejected the observation (HTTP "+response.status+").");
 return result;
}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anon||!service)return json({error:"Device ingestion is not configured"},503);
 const auth=req.headers.get("Authorization");if(!auth)return json({error:"Authentication required"},401);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});const {data:{user},error:authError}=await userClient.auth.getUser();if(authError||!user)return json({error:"Invalid session"},401);
 const raw=await req.text();if(raw.length>12000)return json({error:"Payload too large"},413);let body:any;try{body=JSON.parse(raw);}catch{return json({error:"Invalid JSON"},400);}if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"JSON object required"},400);
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:device,error:deviceError}=await admin.from("amineva_devices").select("id,owner_id,device_key,app_id,component_id,transport,capabilities,status,manufacturer,model,driver_profile_id").eq("id",body.device_id).eq("owner_id",user.id).maybeSingle();
 if(deviceError||!device)return json({error:"Device not found for this authenticated account"},404);
 if(device.status!=="connected")return json({error:"Device is not connected or has been revoked"},403);
 if(body.app_id!==device.app_id||body.component_id!==device.component_id)return json({error:"Target application/component does not match the registered device"},403);
 if(device.app_id==="agroclimate"&&!targetComponent[device.component_id])return json({error:"The selected component has no AgroClimate routing adapter"},422);
 
 const appComponents:Record<string,string[]>={"agroclimate":["weather-observations","agro-forecast","soil-monitoring","agro-risk","agro-inventory","market-link","agtrans","aerial-console","farm-handler","post-harvest"],"inventra":["stock-control","sales-checkout","receipts-labels","product-weighing"],"info-solutions":["information-kiosks","interactive-displays","document-capture","public-terminals"]};
 if(!appComponents[device.app_id]?.includes(device.component_id))return json({error:"Unknown application component"},403);
 if(typeof body.event_id!=="string"||! /^[0-9a-f-]{36}$/i.test(body.event_id))return json({error:"Valid UUID event_id required"},400);
 const metric=typeof body.metric==="string"?body.metric:"",unit=typeof body.unit==="string"?body.unit:"",value=body.value;
 if(!plausible(metric,value,unit))return json({error:"Metric, unit or value failed validation"},422);
 if(!componentMetrics[targetComponent[device.component_id]||device.component_id]?.includes(metric))return json({error:"Metric is not accepted by the selected component"},403);
 if(!(device.capabilities||[]).some((cap:string)=>capMetrics[cap]?.includes(metric)))return json({error:"Device capability does not authorise this measurement"},403);
 const measured=typeof body.measured_at==="string"?Date.parse(body.measured_at):NaN;if(!Number.isFinite(measured)||measured>Date.now()+300000||measured<Date.now()-365*24*60*60*1000)return json({error:"Measurement timestamp is invalid or outside accepted window"},422);
 const metadata=body.metadata??{};if(!metadata||typeof metadata!=="object"||Array.isArray(metadata)||Object.keys(metadata).length>20||Object.entries(metadata).some(([k,v]:[string,any])=>k.length>64||!["string","number","boolean"].includes(typeof v)||(typeof v==="number"&&!Number.isFinite(v))||(typeof v==="string"&&v.length>256)))return json({error:"Invalid metadata"},422);
 const row={event_id:body.event_id,device_id:device.id,owner_id:user.id,app_id:device.app_id,component_id:device.component_id,metric,value,unit,measured_at:new Date(measured).toISOString(),transport:device.transport,manufacturer:device.manufacturer,model:device.model,quality:"valid",metadata};
 let persisted:any=null;
 const {data:inserted,error:insertError}=await admin.from("amineva_device_observations").insert(row).select("*").maybeSingle();
 if(insertError?.code==="23505"){const {data:existing,error:lookupError}=await admin.from("amineva_device_observations").select("*").eq("device_id",device.id).eq("event_id",body.event_id).maybeSingle();if(lookupError||!existing)return json({error:"Duplicate observation could not be confirmed"},503);if(existing.metric!==metric||Number(existing.value)!==value||existing.unit!==unit||Date.parse(existing.measured_at)!==measured)return json({error:"Event ID was already used for a different observation"},409);persisted=existing;}
 else if(insertError||!inserted)return json({error:"Observation persistence failed"},500);else persisted=inserted;
 let delivery="central-realtime";
 if(device.app_id==="agroclimate"){
  const token=typeof body.agroclimate_device_token==="string"?body.agroclimate_device_token:"";if(token.length<32||token.length>256)return json({error:"AgroClimate gateway device token is required; the central observation is saved and can be retried"},400);
  const agroUrl=Deno.env.get("AGROCLIMATE_SUPABASE_URL")||"https://apoqexuhlysoirtcvgfo.supabase.co",agroKey=Deno.env.get("AGROCLIMATE_SUPABASE_ANON_KEY");if(!agroKey)return json({error:"AGROCLIMATE_SUPABASE_ANON_KEY is not configured; central observation is saved but live AgroClimate delivery is pending"},503);
  try {
   if(device.component_id==="post-harvest") {
    if(metric!=="temperature"&&metric!=="humidity")return json({error:"Post-Harvest accepts paired temperature and humidity observations only"},403);
    const {data:pairRows,error:pairError}=await admin.from("amineva_device_observations").select("event_id,metric,value,unit,measured_at").eq("device_id",device.id).in("metric",["temperature","humidity"]).gte("measured_at",new Date(Date.now()-30*60*1000).toISOString()).order("measured_at",{ascending:false}).limit(20);
    if(pairError)return json({error:"Could not assemble the paired Post-Harvest reading"},503);
    const temperature=pairRows?.find((r:any)=>r.metric==="temperature"),humidity=pairRows?.find((r:any)=>r.metric==="humidity");
    if(!temperature||!humidity){delivery="awaiting-temperature-humidity-pair";}
    else {
     const tempC=temperature.unit==="°F"?(Number(temperature.value)-32)*5/9:Number(temperature.value);
     const humidityPct=Number(humidity.value);
     if(!Number.isFinite(tempC)||tempC < -40||tempC>85||!Number.isFinite(humidityPct)||humidityPct<0||humidityPct>100)return json({error:"Paired Post-Harvest values are outside the station's accepted range"},422);
     const pairKey="central:"+device.id+":"+temperature.event_id+":"+humidity.event_id;
     const observedAt=new Date(Math.max(Date.parse(temperature.measured_at),Date.parse(humidity.measured_at))).toISOString();
     await sendAgroClimate(agroUrl,agroKey,token,{action:"ingest",temperature_c:tempC,humidity_pct:humidityPct,observed_at:observedAt,idempotency_key:pairKey,firmware:device.driver_profile_id,sensor_model:device.model||"Central paired BLE sensor"},"post-harvest-station");
     delivery="agroclimate-post-harvest";
    }
   } else {
    const component=targetComponent[device.component_id],remoteMetric=mapMetric(metric);
    const remoteBody={action:"ingest",expected_component:component,metric:remoteMetric,value,unit,observed_at:new Date(measured).toISOString(),idempotency_key:body.event_id,metadata:{...metadata,source:"amineva-central-device-service",central_device_id:device.id,source_model:device.model||null}};
    await sendAgroClimate(agroUrl,agroKey,token,remoteBody);delivery="agroclimate-component";
   }
  } catch(error) { return json({accepted:false,central_saved:true,delivery:"pending",error:error instanceof Error?error.message:"AgroClimate delivery failed; retry this event"},502); }
 }
 await admin.from("amineva_devices").update({last_seen_at:new Date().toISOString(),status:"connected"}).eq("id",device.id).eq("owner_id",user.id);
 return json({accepted:true,duplicate:Boolean(insertError?.code==="23505"),delivery,observation:persisted},insertError?.code==="23505"?200:201);
});
