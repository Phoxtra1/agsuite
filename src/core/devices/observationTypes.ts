import type { DeviceCapability, DeviceTransport } from "./types";
export type ObservationMetric = "temperature"|"humidity"|"soil_moisture"|"soil_temperature"|"soil_ph"|"electrical_conductivity"|"rainfall"|"wind_speed"|"wind_direction"|"water_level"|"weight"|"barcode_count"|"latitude"|"longitude"|"vehicle_speed"|"aircraft_altitude"|"aircraft_battery";
export type AppId = "agroclimate"|"inventra"|"info-solutions";
export interface DeviceObservation {
 eventId:string; deviceId:string; ownerId:string; appId:AppId; componentId:string;
 metric:ObservationMetric; value:number; unit:string; measuredAt:string; receivedAt:string;
 transport:DeviceTransport; manufacturer?:string|null; model?:string|null;
 farmId?:string|null; siteId?:string|null; quality:"valid"|"suspect";
 metadata?:Record<string,string|number|boolean|null>;
}
export interface DeviceRegistration {
 id:string; ownerId:string; deviceKey:string; name:string; appId:AppId; componentId:string;
 transport:DeviceTransport; capabilities:DeviceCapability[]; manufacturer?:string|null; model?:string|null;
 firmwareVersion?:string|null; status:"available"|"connected"|"disconnected"|"error"|"revoked";
 driverProfileId:string; driverConfig:Record<string,unknown>;
}
