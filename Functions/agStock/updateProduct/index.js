// Appwrite Function: AGStock - updateProduct
// Validates updates, prevents negative values, keeps updatedAt accurate.

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

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  const shopId = body.shopId;
  const productId = body.productId;

  if (!shopId || !productId) {
    return json(res, { ok: false, message: "shopId and productId are required." }, 400);
  }

  // Allowed updatable fields
  const updates = {};

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.sku === "string" || body.sku === null) updates.sku = body.sku;
  if (typeof body.barcode === "string" || body.barcode === null) updates.barcode = body.barcode;
  if (typeof body.category === "string" || body.category === null) updates.category = body.category;

  if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate || null;

  if (body.lowStockThreshold !== undefined) {
    const lst = toNumber(body.lowStockThreshold);
    if (lst === null || !Number.isInteger(lst) || lst < 0) {
      return json(res, { ok: false, message: "lowStockThreshold must be an integer >= 0." }, 400);
    }
    updates.lowStockThreshold = lst;
  }

  if (body.costPrice !== undefined) {
    const cp = toNumber(body.costPrice);
    if (cp === null || cp < 0) return json(res, { ok: false, message: "costPrice must be >= 0." }, 400);
    updates.costPrice = Number(cp.toFixed(2));
  }

  if (body.sellingPrice !== undefined) {
    const sp = toNumber(body.sellingPrice);
    if (sp === null || sp < 0) return json(res, { ok: false, message: "sellingPrice must be >= 0." }, 400);
    updates.sellingPrice = Number(sp.toFixed(2));
  }

  if (body.status !== undefined) {
    const status = String(body.status || "").toUpperCase();
    const allowedStatus = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"];
    if (!allowedStatus.includes(status)) {
      return json(res, { ok: false, message: `status must be one of: ${allowedStatus.join(", ")}` }, 400);
    }
    updates.status = status;
  }

  if (body.syncStatus !== undefined) {
    const sync = String(body.syncStatus || "").toUpperCase();
    const allowedSync = ["SYNCED", "PENDING", "FAILED"];
    if (!allowedSync.includes(sync)) {
      return json(res, { ok: false, message: `syncStatus must be one of: ${allowedSync.join(", ")}` }, 400);
    }
    updates.syncStatus = sync;
  }

  if (Object.keys(updates).length === 0) {
    return json(res, { ok: false, message: "No valid fields to update." }, 400);
  }

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

  try {
    const product = await db.getDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId);
    if (product.shopId !== shopId) {
      return json(res, { ok: false, message: "Product does not belong to this shop." }, 403);
    }

    updates.updatedAt = new Date().toISOString();

    await db.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId, updates);

    return json(res, { ok: true, productId, updatedAt: updates.updatedAt });
  } catch (e) {
    const msg = e?.message ? e.message : String(e);
    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to update product", error: msg }, 500);
  }
}

module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) return handler(args[0]);
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
