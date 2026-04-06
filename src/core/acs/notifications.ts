// src/core/acs/notifications.ts
// PURPOSE: Wire ACS intelligence outputs to ComsSDK notifications
// so users receive real-time alerts when AI analysis produces results.

import { AGISComs } from "@/core/coms/hooks/agis";
import { AgroClimateComs } from "@/core/coms/hooks/agroclimate";
import type { ACSIntelligenceOutput } from "@/core/backend/acs";

/**
 * Route an intelligence output to the appropriate ComsSDK notification.
 * Called when a new intelligence output arrives via realtime subscription.
 */
export async function notifyIntelligenceOutput(output: ACSIntelligenceOutput) {
  try {
    const platforms = output.source_platforms ?? [];

    // AGIS-related intelligence → push via AGISComs
    if (platforms.includes("agis") || output.category === "pattern" || output.category === "anomaly") {
      await AGISComs.reportReady({
        reportTitle: output.title,
        category: output.category,
        confidence: output.confidence ?? 0.5,
      });
    }

    // AgroClimate-related intelligence → push via AgroClimateComs
    if (platforms.includes("agroclimate") || output.category === "agro_climate") {
      await AgroClimateComs.cropAdvisory({
        cropName: "Intelligence",
        advisory: output.summary ?? output.title,
        region: "All Regions",
      });
    }

    // High-severity anomaly alerts → push anomaly notification
    if (output.category === "predictive_alert" || output.category === "anomaly") {
      const intel = output.intelligence as Record<string, any>;
      const anomalies = intel?.anomalies ?? [];
      const highSeverity = anomalies.find((a: any) => a.severity === "high" || a.severity === "critical");

      if (highSeverity) {
        await AGISComs.anomalyDetected({
          metric: highSeverity.description ?? output.title,
          deviation: highSeverity.data_point ?? "significant",
          severity: highSeverity.severity === "critical" ? "error" : "warning",
        });
      }
    }
  } catch (err) {
    console.warn("[ACS Notifications] Failed to push notification:", err);
  }
}
