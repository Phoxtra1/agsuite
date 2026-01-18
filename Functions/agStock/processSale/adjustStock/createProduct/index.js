// Appwrite Function: AGStock - createProduct

const sdk = require("node-appwrite");

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

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

function isIsoDateString(s) {
  if (!s || typeof s !== "string") return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  // Required (minimal)
  const shopId = body.shopId;
  const name = body.name;

  // Optional identifiers
  const sku = body.sku || null;
  const barcode = body.barcode || null;

  // Stock + pricing (recommended required)
  const quantityRaw = body.quantity;
  const costPriceRaw = body.costPrice;
  const sellingPriceRaw = body.sellingPrice;

  const quantity = quantityRaw === undefined ? 0 : toNumber(quantityRaw);
  const costPrice = costPriceRaw === undefined ? null : toNumber(costPriceRaw);
  const sellingPrice = sellingPriceRaw === undefined ? null : toNumber(sellingPriceRaw);

  // Other fields
  const category = body.category || null;
  const expiryDate = body.expiryDate || null; // datetime ISO string
  const lowStockThresholdRaw = body.lowStockThreshold;
  const lowStockThreshold = lowStockThresholdRaw === undefined ? null : toNumber(lowStockThresholdRaw);

  const status = (body.status || "ACTIVE").toUpperCase();
  const syncStatus = (body.syncStatus || "PENDING").toUpperCase();

  // Optional id (for offline sync)
  const productId = body.id || sdk.ID.unique();

  // Validation: shopId, name
  if (!shopId || !name) {
    return json(res, { ok: false, message: "shopId and name are required." }, 400);
  }

  // Validation: quantity
  if (quantity === null || !Number.isInteger(quantity) || quantity < 0) {
    return json(res, { ok: false, message: "quantity must be an integer >= 0." }, 400);
  }

  // Validation: prices
  if (costPrice === null || costPrice < 0) {
    return json(res, { ok: false, message: "costPrice is required and must be >= 0." }, 400);
  }
  if (sellingPrice === null || sellingPrice < 0) {
    return json(res, { ok: false, message: "sellingPrice is required and must be >= 0." }, 400);
  }

  // Validation: enums
  const allowedStatus = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"];
  const allowedSync = ["SYNCED", "PENDING", "FAILED"];

  if (!allowedStatus.includes(status)) {
    return json(res, { ok: false, message: `status must be one of: ${allowedStatus.join(", ")}` }, 400);
  }
  if (!allowedSync.includes(syncStatus)) {
    return json(res, { ok: false, message: `syncStatus must be one of: ${allowedSync.join(", ")}` }, 400);
  }

  // Validation: expiryDate format (if provided)
  if (expiryDate !== null && expiryDate !== "" && !isIsoDateString(expiryDate)) {
    return json(res, { ok: false, message: "expiryDate must be a valid ISO datetime string." }, 400);
  }

  // Validation: lowStockThreshold
  if (lowStockThreshold !== null) {
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      return json(res, { ok: false, message: "lowStockThreshold must be an integer >= 0 if provided." }, 400);
    }
  }

  // ENV requirements
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

  try {
    // Derive status: if quantity is 0, OUT_OF_STOCK is allowed, but ACTIVE also allowed.
    // We keep what user passed; however, if qty==0 and status==ACTIVE, it’s still acceptable.
    // If you want automatic override, uncomment:
    // const finalStatus = quantity === 0 ? "OUT_OF_STOCK" : status;
    const finalStatus = status;

    const doc = {
      id: String(productId),
      shopId,
      name,
      sku,
      barcode,
      quantity,
      costPrice: Number(costPrice.toFixed(2)),
      sellingPrice: Number(sellingPrice.toFixed(2)),
      category,
      expiryDate: expiryDate || null,
      lowStockThreshold: lowStockThreshold !== null ? lowStockThreshold : null,
      status: finalStatus,
      syncStatus,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Create with productId as document ID (idempotent-friendly)
    await db.createDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, String(productId), doc);

    return json(res, {
      ok: true,
      productId: String(productId),
      createdAt: nowIso
    });
  } catch (e) {
    const msg = (e && e.message) ? e.message : String(e);

    // Idempotency safe response
    if (msg.toLowerCase().includes("document with the requested id already exists")) {
      return json(res, { ok: true, productId: String(productId), message: "Product already exists (idempotent)." }, 200);
    }

    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to create product", error: msg }, 500);
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
