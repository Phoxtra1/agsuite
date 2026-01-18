// Appwrite Function: AGStock - reverseSale
// Reverses a sale by restoring stock, creating an audit stock movement, and marking sale as reversed.

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
  const saleId = body.saleId || body.id; // accept either
  const reason = body.reason || "SALE_REVERSAL";
  const staffId = body.staffId || null;
  const staffName = body.staffName || null;
  const syncStatus = (body.syncStatus || "PENDING").toUpperCase();

  if (!shopId || !saleId) {
    return json(res, { ok: false, message: "shopId and saleId are required." }, 400);
  }

  // ENV
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;
  const PRODUCTS_COLLECTION_ID = process.env.PRODUCTS_COLLECTION_ID;
  const SALES_COLLECTION_ID = process.env.SALES_COLLECTION_ID;
  const STOCKMOVEMENTS_COLLECTION_ID = process.env.STOCKMOVEMENTS_COLLECTION_ID;
  const NOTIFICATIONS_COLLECTION_ID = process.env.NOTIFICATIONS_COLLECTION_ID; // optional

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    return json(res, { ok: false, message: "Missing Appwrite env: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_API_KEY" }, 500);
  }
  if (!DATABASE_ID || !PRODUCTS_COLLECTION_ID || !SALES_COLLECTION_ID || !STOCKMOVEMENTS_COLLECTION_ID) {
    return json(
      res,
      {
        ok: false,
        message:
          "Missing env: DATABASE_ID, PRODUCTS_COLLECTION_ID, SALES_COLLECTION_ID, STOCKMOVEMENTS_COLLECTION_ID (and optionally NOTIFICATIONS_COLLECTION_ID)."
      },
      500
    );
  }

  const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new sdk.Databases(client);

  const nowIso = new Date().toISOString();

  try {
    // 1) Fetch sale
    const sale = await db.getDocument(DATABASE_ID, SALES_COLLECTION_ID, String(saleId));

    if (sale.shopId !== shopId) {
      return json(res, { ok: false, message: "Sale does not belong to this shop." }, 403);
    }

    // Prevent double reversal (idempotency)
    // We store reversedAt + isReversed fields on the sale document.
    if (sale.isReversed === true || sale.reversedAt) {
      return json(res, { ok: true, saleId: String(saleId), message: "Sale already reversed (idempotent)." }, 200);
    }

    const productId = sale.productId;
    const qtySold = toNumber(sale.quantity);

    if (!productId || qtySold === null || !Number.isInteger(qtySold) || qtySold <= 0) {
      return json(res, { ok: false, message: "Sale record is invalid (missing productId/quantity)." }, 500);
    }

    // 2) Fetch product (may still exist)
    const product = await db.getDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, String(productId));

    if (product.shopId !== shopId) {
      return json(res, { ok: false, message: "Product does not belong to this shop." }, 403);
    }

    const currentQty = toNumber(product.quantity);
    if (currentQty === null) {
      return json(res, { ok: false, message: "Product quantity is invalid." }, 500);
    }

    // 3) Restore stock
    const newQty = currentQty + qtySold;

    // Update status if previously out of stock
    let nextStatus = product.status || "ACTIVE";
    if (newQty > 0 && nextStatus === "OUT_OF_STOCK") nextStatus = "ACTIVE";

    await db.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, String(productId), {
      quantity: newQty,
      status: nextStatus
    });

    // 4) Create stock movement IN (audit trail)
    const movementId = sdk.ID.unique();
    await db.createDocument(DATABASE_ID, STOCKMOVEMENTS_COLLECTION_ID, movementId, {
      id: movementId,
      shopId,
      productId: String(productId),
      productName: sale.productName || product.name || "Unknown Product",
      type: "IN",
      quantity: qtySold,
      reason,
      staffId,
      staffName,
      imageEvidence: null,
      syncStatus,
      createdAt: nowIso
    });

    // 5) Mark sale as reversed (no deletion)
    await db.updateDocument(DATABASE_ID, SALES_COLLECTION_ID, String(saleId), {
      isReversed: true,
      reversedAt: nowIso,
      reversedReason: reason,
      reversedById: staffId,
      reversedByName: staffName,
      updatedAt: nowIso // if your sales schema doesn't include updatedAt, remove this line
    });

    // 6) Optional notification
    if (NOTIFICATIONS_COLLECTION_ID) {
      const notifId = sdk.ID.unique();
      await db.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, {
        id: notifId,
        shopId,
        type: "BUSINESS",
        category: "SALES",
        title: "Sale Reversed",
        message: `Sale reversed for ${sale.productName || "product"} (Qty: ${qtySold}). Stock restored.`,
        severity: "INFO",
        isRead: false,
        relatedId: String(saleId),
        createdAt: nowIso
      });
    }

    return json(res, {
      ok: true,
      saleId: String(saleId),
      productId: String(productId),
      restoredQuantity: qtySold,
      previousProductQuantity: currentQty,
      newProductQuantity: newQty
    });
  } catch (e) {
    const msg = e?.message ? e.message : String(e);
    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to reverse sale", error: msg }, 500);
  }
}

module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) return handler(args[0]);
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
