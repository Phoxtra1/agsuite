// Appwrite Function: AGStock - lowStockCheck
// Scans products for low/out-of-stock and creates notifications with cooldown to avoid duplicates.

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

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toIso(date) {
  return new Date(date).toISOString();
}

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  const shopId = body.shopId;
  // Optional: limit number of products fetched per run
  const limit = Number.isFinite(Number(body.limit)) ? Math.min(Math.max(Number(body.limit), 1), 100) : 100;

  // Cooldown minutes to avoid duplicate notification spam
  // Default 720 = 12 hours
  const cooldownMinutes = Number.isFinite(Number(body.cooldownMinutes))
    ? Math.min(Math.max(Number(body.cooldownMinutes), 5), 10080) // 5 min to 7 days
    : 720;

  if (!shopId) {
    return json(res, { ok: false, message: "shopId is required." }, 400);
  }

  // ENV requirements
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;
  const PRODUCTS_COLLECTION_ID = process.env.PRODUCTS_COLLECTION_ID;
  const NOTIFICATIONS_COLLECTION_ID = process.env.NOTIFICATIONS_COLLECTION_ID;

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    return json(res, { ok: false, message: "Missing Appwrite env: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_API_KEY" }, 500);
  }
  if (!DATABASE_ID || !PRODUCTS_COLLECTION_ID || !NOTIFICATIONS_COLLECTION_ID) {
    return json(res, { ok: false, message: "Missing env: DATABASE_ID, PRODUCTS_COLLECTION_ID, NOTIFICATIONS_COLLECTION_ID" }, 500);
  }

  const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new sdk.Databases(client);

  const now = new Date();
  const nowIso = now.toISOString();
  const cooldownStartIso = toIso(now.getTime() - cooldownMinutes * 60 * 1000);

  const results = {
    ok: true,
    shopId,
    scanned: 0,
    lowStock: 0,
    outOfStock: 0,
    notificationsCreated: 0,
    cooldownMinutes
  };

  try {
    // Fetch products for the shop
    // NOTE: Appwrite supports queries. We'll filter by shopId.
    const productList = await db.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
      sdk.Query.equal("shopId", shopId),
      sdk.Query.limit(limit),
      sdk.Query.orderDesc("updatedAt")
    ]);

    const products = productList.documents || [];
    results.scanned = products.length;

    // Helper: check if notification already exists in cooldown window
    async function recentlyNotified(productId, title) {
      const existing = await db.listDocuments(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, [
        sdk.Query.equal("shopId", shopId),
        sdk.Query.equal("relatedId", productId),
        sdk.Query.equal("title", title),
        sdk.Query.greaterThanEqual("createdAt", cooldownStartIso),
        sdk.Query.limit(1)
      ]);
      return (existing.documents || []).length > 0;
    }

    for (const p of products) {
      const qty = toNumber(p.quantity) ?? 0;
      const threshold = toNumber(p.lowStockThreshold);

      const productName = p.name || p.productName || "Unknown Product";
      const productId = p.$id || p.id; // prefer document id

      // Out of stock
      if (qty === 0) {
        results.outOfStock += 1;

        const title = "Out of Stock";
        const already = await recentlyNotified(productId, title);
        if (!already) {
          const notifId = sdk.ID.unique();
          await db.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, {
            id: notifId,
            shopId,
            type: "BUSINESS",
            category: "STOCK",
            title,
            message: `${productName} is out of stock.`,
            severity: "CRITICAL",
            isRead: false,
            relatedId: productId,
            createdAt: nowIso
          });
          results.notificationsCreated += 1;
        }

        continue;
      }

      // Low stock (only if threshold is set)
      if (threshold !== null && qty <= threshold) {
        results.lowStock += 1;

        const title = "Low Stock Alert";
        const already = await recentlyNotified(productId, title);
        if (!already) {
          const notifId = sdk.ID.unique();
          await db.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, {
            id: notifId,
            shopId,
            type: "BUSINESS",
            category: "STOCK",
            title,
            message: `${productName} is low in stock. Remaining: ${qty}.`,
            severity: "WARNING",
            isRead: false,
            relatedId: productId,
            createdAt: nowIso
          });
          results.notificationsCreated += 1;
        }
      }
    }

    return json(res, results, 200);
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);
    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to run lowStockCheck", error: msg }, 500);
  }
}

// Wrapper for older signature styles
module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) {
    return handler(args[0]);
  }
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
