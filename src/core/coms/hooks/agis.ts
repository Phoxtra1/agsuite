// src/core/coms/hooks/agis.ts
// AGIS event hooks — route all AGIS communications through ComsSDK

import { ComsSDK } from "@/core/coms/sdk";

const SOURCE = "AGIS";

export const AGISComs = {
  /** Intelligence report ready */
  async reportReady(opts: {
    reportTitle: string;
    category: string;
    confidence: number;
  }) {
    await ComsSDK.pushNotification({
      title: "Intelligence Report Ready",
      message: `"${opts.reportTitle}" (${opts.category}) — ${Math.round(opts.confidence * 100)}% confidence`,
      type: "success",
      sourceApp: SOURCE,
    });
  },

  /** Data anomaly detected */
  async anomalyDetected(opts: {
    metric: string;
    deviation: string;
    severity: "info" | "warning" | "error";
  }) {
    await ComsSDK.pushNotification({
      title: "Data Anomaly Detected",
      message: `${opts.metric}: ${opts.deviation} deviation from baseline`,
      type: opts.severity,
      sourceApp: SOURCE,
    });

    await ComsSDK.logEvent({
      event: "anomaly-detected",
      channel: "in-app",
      recipient: "analyst",
      subject: `Anomaly: ${opts.metric}`,
      sourceApp: SOURCE,
      messageType: "system",
      deliveryStatus: "sent",
    });
  },

  /** Scheduled analysis complete — email the user */
  async analysisComplete(opts: {
    userEmail: string;
    userName?: string;
    analysisType: string;
    resultsSummary: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#3b82f6">AGIS Analysis Complete</h2>
        <p>Hi ${opts.userName || "there"},</p>
        <p>Your <strong>${opts.analysisType}</strong> analysis has finished.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:0">${opts.resultsSummary}</p>
        </div>
        <p>Log in to your Amineva Suite to view the full report.</p>
        <p style="color:#64748b;font-size:12px">Powered by Amineva AGIS</p>
      </div>`;

    await ComsSDK.sendEmail({
      to: [{ email: opts.userEmail, name: opts.userName }],
      subject: `Analysis Complete: ${opts.analysisType}`,
      htmlContent: html,
      sourceApp: SOURCE,
      messageType: "transactional",
      tags: ["analysis-complete"],
    });
  },

  /** Sync failure notification */
  async syncFailed(opts: { platform: string; error: string }) {
    await ComsSDK.pushNotification({
      title: "Sync Failed",
      message: `${opts.platform} sync error: ${opts.error}`,
      type: "error",
      sourceApp: SOURCE,
    });
  },
};
