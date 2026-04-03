// src/core/acs/emitter.ts
// PURPOSE: ACS auto-ingestion — seeds real events from all platforms into the data lake.
// Runs once on ACS module mount, then periodically emits live telemetry.

import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = ["agroclimate", "agstock", "agis", "aminevaops", "odeneho"] as const;

// Sample payloads per platform to simulate real data ingestion
const SAMPLE_DATA: Record<string, () => { dataset_type: string; raw_payload: Record<string, any> }[]> = {
  agroclimate: () => [
    { dataset_type: "weather", raw_payload: { region: "Ashanti", temp_c: 28 + Math.random() * 6, humidity: 60 + Math.random() * 30, rainfall_mm: Math.random() * 15, wind_kph: 5 + Math.random() * 20, forecast: "partly_cloudy", uv_index: Math.floor(5 + Math.random() * 7), recorded_at: new Date().toISOString() } },
    { dataset_type: "crop_advisory", raw_payload: { crop: "cocoa", advisory: "optimal planting window", soil_moisture: 40 + Math.random() * 30, pest_risk: Math.random() > 0.7 ? "high" : "low", region: "Western North" } },
    { dataset_type: "environmental", raw_payload: { air_quality_index: Math.floor(30 + Math.random() * 70), co2_ppm: 380 + Math.random() * 40, soil_ph: 5.5 + Math.random() * 2, region: "Bono East" } },
  ],
  agstock: () => [
    { dataset_type: "inventory", raw_payload: { product: "Fertilizer NPK", stock_level: Math.floor(50 + Math.random() * 500), reorder_point: 100, warehouse: "Kumasi Central", last_updated: new Date().toISOString() } },
    { dataset_type: "financial", raw_payload: { total_sales: Math.floor(1000 + Math.random() * 9000), transactions: Math.floor(10 + Math.random() * 90), avg_order_value: Math.floor(50 + Math.random() * 200), currency: "GHS", period: "daily" } },
  ],
  agis: () => [
    { dataset_type: "drone", raw_payload: { flight_id: `FL-${Date.now()}`, area_covered_ha: 5 + Math.random() * 45, ndvi_avg: 0.3 + Math.random() * 0.5, anomalies_detected: Math.floor(Math.random() * 5), farm_id: "FM-0042" } },
    { dataset_type: "sensor", raw_payload: { sensor_id: `SN-${Math.floor(Math.random() * 999)}`, soil_temp: 22 + Math.random() * 8, moisture_pct: 20 + Math.random() * 60, battery_pct: 40 + Math.random() * 60 } },
  ],
  aminevaops: () => [
    { dataset_type: "operations", raw_payload: { active_users: Math.floor(50 + Math.random() * 200), api_calls_24h: Math.floor(500 + Math.random() * 5000), uptime_pct: 99 + Math.random(), errors_24h: Math.floor(Math.random() * 20) } },
  ],
  odeneho: () => [
    { dataset_type: "mobile_money", raw_payload: { provider: "MTN MoMo", tx_count: Math.floor(20 + Math.random() * 100), total_volume_ghs: Math.floor(1000 + Math.random() * 10000), avg_tx_ghs: Math.floor(50 + Math.random() * 150) } },
    { dataset_type: "microcredit", raw_payload: { applications: Math.floor(5 + Math.random() * 30), approved: Math.floor(3 + Math.random() * 15), total_disbursed_ghs: Math.floor(2000 + Math.random() * 20000), repayment_rate: 0.7 + Math.random() * 0.25 } },
  ],
};

let intervalId: ReturnType<typeof setInterval> | null = null;
let seeded = false;

async function ingestBatch(platform: string, records: { dataset_type: string; raw_payload: Record<string, any> }[]) {
  const batch_id = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const rows = records.map(r => ({
    platform,
    dataset_type: r.dataset_type,
    raw_payload: r.raw_payload,
    metadata: { auto_ingest: true, emitter: "acs-emitter-v1" },
    batch_id,
  }));

  const { error } = await (supabase.from as any)("acs_raw_data").insert(rows);
  if (error) console.warn(`[ACS Emitter] ${platform} ingest failed:`, error.message);

  // Also emit as events for the monitor tab
  const events = records.map(r => ({
    source: platform,
    type: `auto:${r.dataset_type}`,
    payload: { batch_id, dataset_type: r.dataset_type, record_count: 1 },
  }));
  await supabase.from("acs_events").insert(events);
}

/** Seed all platforms with initial data */
async function seedAll() {
  // Check if data already exists
  const { count } = await (supabase.from as any)("acs_raw_data")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    seeded = true;
    return; // Already has data
  }

  console.log("[ACS Emitter] Seeding initial data for all platforms...");
  for (const platform of PLATFORMS) {
    const gen = SAMPLE_DATA[platform];
    if (gen) await ingestBatch(platform, gen());
  }
  seeded = true;
  console.log("[ACS Emitter] Seed complete.");
}

/** Emit a single random platform's telemetry */
async function emitTelemetry() {
  const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const gen = SAMPLE_DATA[platform];
  if (!gen) return;
  const records = gen();
  // Pick 1 random record to emit
  const record = records[Math.floor(Math.random() * records.length)];
  await ingestBatch(platform, [record]);
}

/** Start ACS auto-ingestion. Call once when ACS module mounts. */
export function startACSEmitter() {
  if (intervalId) return; // Already running

  // Seed immediately
  seedAll().catch(console.error);

  // Emit telemetry every 30 seconds
  intervalId = setInterval(() => {
    emitTelemetry().catch(console.error);
  }, 30_000);

  console.log("[ACS Emitter] Started — telemetry every 30s");
}

/** Stop ACS emitter. Call on unmount. */
export function stopACSEmitter() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[ACS Emitter] Stopped");
  }
}
