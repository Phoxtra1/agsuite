// Appwrite Function: AGStock - dailySalesSummary
// Aggregates sales per day for a shop (read-only, deployment-safe)

const sdk = require("node-appwrite");

function parseBody(req) {
  try {
    if (!req || !req.body) return {};
    if (typeof req.body === "string") return JSON.parse(req.body || "{}");
    return req.body || {};
  } catch {
    return {};
  }
}

function json(res, data, status = 200) {
  if (res && typeof res.json === "function") return res.json(data, status);
  if (res && typeof res.send === "function") {
    res.statusCode = status;
    return res.send(JSON.stringify(data));
  }
  return null;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDateKey(iso) {
  // YYYY-MM-DD
  const d = new Date(iso);
  return d.toISOString().split("T")[0];
}

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  const shopId = body.shopId;
  const startDate = body.startDate || null; // ISO (optional)
  const endDate = body.endDate || null;     // ISO (optional)
  const limit = Number.isFinite(Number(body.limit)) ? Math.min(Math.max(Number(body.limit), 1), 1000) : 1000;

  if (!shopId) {
    return json(res, { ok: false, message: "shopId is required." }, 400);
  }

  // ENV
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;
  const SALES_COLLECTION_ID = process.env.SALES_COLLECTION_ID;

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    return json(res, { ok: false, message: "Missing Appwrite env." }, 500);
  }
  if (!DATABASE_ID || !SALES_COLLECTION_ID) {
    return json(res, { ok: false, message: "Missing DATABASE_ID or SALES_COLLECTION_ID." }, 500);
  }

  const client = new sdk.Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const db = new sdk.Databases(client);

  try {
    const queries = [
      sdk.Query.equal("shopId", shopId),
      sdk.Query.limit(limit),
      sdk.Query.orderAsc("createdAt")
    ];

    if (startDate) queries.push(sdk.Query.greaterThanEqual("createdAt", startDate));
    if (endDate) queries.push(sdk.Query.lessThanEqual("createdAt", endDate));

    const salesList = await db.listDocuments(
      DATABASE_ID,
      SALES_COLLECTION_ID,
      queries
    );

    const summary = {};

    for (const sale of salesList.documents) {
      // Skip reversed sales
      if (sale.isReversed === true) continue;

      const dayKey = toDateKey(sale.createdAt);
      if (!summary[dayKey]) {
        summary[dayKey] = {
          date: dayKey,
          salesCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          paid: 0,
          partial: 0,
          unpaid: 0
        };
      }

      const day = summary[dayKey];

      day.salesCount += 1;
      day.totalQuantity += toNumber(sale.quantity);
      day.totalRevenue += toNumber(sale.totalAmount);

      if (sale.paymentStatus === "PAID") day.paid += 1;
      else if (sale.paymentStatus === "PARTIAL") day.partial += 1;
      else day.unpaid += 1;
    }

    // Convert map → sorted array
    const result = Object.values(summary).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return json(res, {
      ok: true,
      shopId,
      range: { startDate, endDate },
      days: result.length,
      data: result
    });
  } catch (e) {
    const msg = e?.message || String(e);
    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to generate daily sales summary", error: msg }, 500);
  }
}

module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) return handler(args[0]);
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
