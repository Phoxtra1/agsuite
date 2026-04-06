// src/core/coms/hooks/agroclimate.ts
// AgroClimate event hooks — route all AgroClimate communications through ComsSDK

import { ComsSDK } from "@/core/coms/sdk";

const SOURCE = "AgroClimate";

export const AgroClimateComs = {
  /** Severe weather alert — email + in-app */
  async weatherAlert(opts: {
    userEmail: string;
    userName?: string;
    region: string;
    alertType: string;
    severity: "warning" | "error";
    description: string;
  }) {
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#f59e0b">⚠ Weather Alert: ${opts.alertType}</h2>
        <p>Hi ${opts.userName || "Farmer"},</p>
        <p><strong>Region:</strong> ${opts.region}</p>
        <p>${opts.description}</p>
        <p>Take necessary precautions for your crops and livestock.</p>
        <p style="color:#64748b;font-size:12px">Powered by Amineva AgroClimate</p>
      </div>`;

    await ComsSDK.sendEmail({
      to: [{ email: opts.userEmail, name: opts.userName }],
      subject: `⚠ ${opts.alertType} — ${opts.region}`,
      htmlContent: html,
      sourceApp: SOURCE,
      messageType: "transactional",
      tags: ["weather-alert", opts.alertType.toLowerCase()],
    });

    await ComsSDK.pushNotification({
      title: `Weather Alert: ${opts.alertType}`,
      message: `${opts.region} — ${opts.description}`,
      type: opts.severity,
      sourceApp: SOURCE,
    });
  },

  /** Crop advisory notification */
  async cropAdvisory(opts: {
    cropName: string;
    advisory: string;
    region: string;
  }) {
    await ComsSDK.pushNotification({
      title: `Crop Advisory: ${opts.cropName}`,
      message: `${opts.region} — ${opts.advisory}`,
      type: "info",
      sourceApp: SOURCE,
    });

    await ComsSDK.logEvent({
      event: "crop-advisory-sent",
      channel: "in-app",
      recipient: "farmer",
      subject: `Advisory: ${opts.cropName}`,
      sourceApp: SOURCE,
      messageType: "system",
      deliveryStatus: "sent",
    });
  },

  /** Seasonal forecast ready */
  async seasonalForecast(opts: {
    season: string;
    region: string;
    summary: string;
  }) {
    await ComsSDK.pushNotification({
      title: `Seasonal Forecast: ${opts.season}`,
      message: `${opts.region} — ${opts.summary}`,
      type: "info",
      sourceApp: SOURCE,
    });
  },

  /** Irrigation recommendation */
  async irrigationRecommendation(opts: {
    fieldName: string;
    recommendation: string;
  }) {
    await ComsSDK.pushNotification({
      title: "Irrigation Recommendation",
      message: `${opts.fieldName}: ${opts.recommendation}`,
      type: "info",
      sourceApp: SOURCE,
    });
  },
};
