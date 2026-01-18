// Appwrite Function: AGStock - bulkImportProducts
// Accepts { shopId, products: [...] } and creates product documents safely with per-item results.

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

function isIsoDateString(s) {
  if (!s || typeof s !== "string") return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function validateEnums(status, syncStatus) {
  const allowedStatus = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"];
  const allowedSync = ["SYNCED", "PENDING", "FAILED"];
  if (!allowedStatus.includes(status)) return { ok: false, message: `Invalid status: ${status}` };
  if (!allowedSync.includes(syncStatus)) return { ok: false, message: `Invalid syncStatus: ${syncStatus}` };
  return { ok: true };
}

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  const shopId = body.shopId;
  const products = Array.isArray(body.products) ? body.products : [];

  // Safety: limit per run to avoid timeouts
  const maxItems = Number.isFinite(Number(body.maxItems))
    ? Math.min(Math.max(Number(body.maxItems), 1), 200)
    : 200;

  if (!shopId) {
    return json(res, { ok: false, message: "shopId is required." }, 400);
  }

  if (!Array.isArray(products) || products.length === 0) {
    return json(res, { ok: false, message: "products must be a non-empty array." }, 400);
  }

  const items = products.slice(0, maxItems);

  // ENV
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;
  const PRODUCTS_COLLECTION_ID = process.env.PRODUCTS_COLLECTION_ID;

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    return json(res, { ok: false, message: "Missing Appwrite env: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_API_KEY" }, 500);
  }
  if (!DATABASE_ID || !PRODUCTS_COLLECTION_ID) {
    return json(res, { ok: false, message: "Missing env: DATABASE_ID, PRODUCTS_COLLECTION_ID" }, 500);
  }

  const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new sdk.Databases(client);

  const nowIso = new Date().toISOString();

  const report = {
    ok: true,
    shopId,
    received: products.length,
    processed: items.length,
    created: 0,
    skippedExisting: 0,
    failed: 0,
    results: [] // per-item result
  };

  for (let i = 0; i < items.length; i += 1) {
    const p = items[i] || {};

    try {
      const name = typeof p.name === "string" ? p.name.trim() : "";
      if (!name) throw new Error("Missing name");

      const quantity = p.quantity === undefined ? 0 : toNumber(p.quantity);
      if (quantity === null || !Number.isInteger(quantity) || quantity < 0) {
        throw new Error("quantity must be integer >= 0");
      }

      const costPrice = toNumber(p.costPrice);
      const sellingPrice = toNumber(p.sellingPrice);
      if (costPrice === null || costPrice < 0) throw new Error("costPrice must be >= 0");
      if (sellingPrice === null || sellingPrice < 0) throw new Error("sellingPrice must be >= 0");

      const status = String(p.status || "ACTIVE").toUpperCase();
      const syncStatus = String(p.syncStatus || "PENDING").toUpperCase();

      const enumCheck = validateEnums(status, syncStatus);
      if (!enumCheck.ok) throw new Error(enumCheck.message);

      const expiryDate = p.expiryDate || null;
      if (expiryDate && !isIsoDateString(expiryDate)) throw new Error("expiryDate must be ISO datetime");

      const lowStockThreshold = p.lowStockThreshold === undefined ? null : toNumber(p.lowStockThreshold);
      if (lowStockThreshold !== null) {
        if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
          throw new Error("lowStockThreshold must be integer >= 0");
        }
      }

      const docId = p.id ? String(p.id) : sdk.ID.unique();

      const doc = {
        id: docId,
        shopId,
        name,
        sku: p.sku || null,
        barcode: p.barcode || null,
        quantity,
        costPrice: Number(costPrice.toFixed(2)),
        sellingPrice: Number(sellingPrice.toFixed(2)),
        category: p.category || null,
        expiryDate: expiryDate || null,
        lowStockThreshold: lowStockThreshold !== null ? lowStockThreshold : null,
        status,
        syncStatus,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      await db.createDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, docId, doc);

      report.created += 1;
      report.results.push({ index: i, ok: true, productId: docId });
    } catch (e) {
      const msg = e?.message ? e.message : String(e);

      // Existing doc id => treat as safe skip
      if (msg.toLowerCase().includes("document with the requested id already exists")) {
        report.skippedExisting += 1;
        report.results.push({ index: i, ok: true, productId: items[i]?.id, skipped: true, message: "Already exists" });
      } else {
        report.failed += 1;
        report.results.push({ index: i, ok: false, error: msg });
      }
    }
  }

  return json(res, report, 200);
}

module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) return handler(args[0]);
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
