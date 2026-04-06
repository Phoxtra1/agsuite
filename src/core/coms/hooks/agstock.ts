// src/core/coms/hooks/agstock.ts
// AGStock event hooks — route all AGStock communications through ComsSDK

import { ComsSDK } from "@/core/coms/sdk";

const SOURCE = "AGStock";

export const AGStockComs = {
  /** Notify customer + log when a sale is processed */
  async orderConfirmation(opts: {
    customerEmail: string;
    customerName?: string;
    orderId: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
  }) {
    const itemRows = opts.items
      .map(i => `<tr><td style="padding:4px 8px">${i.name}</td><td style="padding:4px 8px">${i.qty}</td><td style="padding:4px 8px">GHS ${i.price.toFixed(2)}</td></tr>`)
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#16a34a">Order Confirmed ✓</h2>
        <p>Hi ${opts.customerName || "Customer"},</p>
        <p>Your order <strong>#${opts.orderId.slice(0, 8)}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f1f5f9"><th style="padding:4px 8px;text-align:left">Item</th><th style="padding:4px 8px">Qty</th><th style="padding:4px 8px">Price</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold">Total: GHS ${opts.total.toFixed(2)}</p>
        <p style="color:#64748b;font-size:12px">Powered by Amineva AGStock</p>
      </div>`;

    await ComsSDK.sendEmail({
      to: [{ email: opts.customerEmail, name: opts.customerName }],
      subject: `Order Confirmed — #${opts.orderId.slice(0, 8)}`,
      htmlContent: html,
      sourceApp: SOURCE,
      messageType: "transactional",
      tags: ["order-confirmation"],
    });

    await ComsSDK.pushNotification({
      title: "Sale Processed",
      message: `Order #${opts.orderId.slice(0, 8)} — GHS ${opts.total.toFixed(2)} confirmed`,
      type: "success",
      sourceApp: SOURCE,
    });
  },

  /** Low stock alert to shop owner */
  async lowStockAlert(opts: {
    productName: string;
    currentQty: number;
    threshold: number;
    shopName?: string;
  }) {
    await ComsSDK.pushNotification({
      title: "Low Stock Alert",
      message: `${opts.productName} is at ${opts.currentQty} units (threshold: ${opts.threshold})${opts.shopName ? ` in ${opts.shopName}` : ""}`,
      type: "warning",
      sourceApp: SOURCE,
    });

    await ComsSDK.logEvent({
      event: "low-stock-alert",
      channel: "in-app",
      recipient: "shop-owner",
      subject: `Low Stock: ${opts.productName}`,
      sourceApp: SOURCE,
      messageType: "system",
      deliveryStatus: "sent",
    });
  },

  /** Out of stock alert */
  async outOfStockAlert(opts: { productName: string; shopName?: string }) {
    await ComsSDK.pushNotification({
      title: "Out of Stock",
      message: `${opts.productName} is now out of stock${opts.shopName ? ` in ${opts.shopName}` : ""}. Reorder needed.`,
      type: "error",
      sourceApp: SOURCE,
    });
  },

  /** New employee added notification */
  async employeeAdded(opts: { employeeName: string; role: string }) {
    await ComsSDK.pushNotification({
      title: "Employee Added",
      message: `${opts.employeeName} joined as ${opts.role}`,
      type: "info",
      sourceApp: SOURCE,
    });
  },

  /** Daily sales summary notification */
  async dailySummary(opts: {
    date: string;
    totalSales: number;
    totalRevenue: number;
    topProduct?: string;
  }) {
    await ComsSDK.pushNotification({
      title: "Daily Sales Summary",
      message: `${opts.date}: ${opts.totalSales} sales, GHS ${opts.totalRevenue.toFixed(2)} revenue${opts.topProduct ? `. Top: ${opts.topProduct}` : ""}`,
      type: "info",
      sourceApp: SOURCE,
    });
  },
};
