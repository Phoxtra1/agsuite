// Appwrite Function: AGStock - processSale
// Compatible with newer Appwrite function signature ({ req, res, log, error })
// and includes a fallback wrapper for older (req, res) style.

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
    // Some runtimes may pass already-parsed JSON
    return req.body || {};
  } catch {
    return {};
  }
}

function json(res, data, status = 200) {
  // Appwrite res.json signature exists in newer runtimes
  if (res && typeof res.json === "function") return res.json(data, status);
  // Fallback (older)
  if (res && typeof res.send === "function") {
    res.statusCode = status;
    return res.send(JSON.stringify(data));
  }
  return null;
}

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  // Required inputs
  const shopId = body.shopId;
  const productId = body.productId;
  const productNameInput = body.productName; // optional, but we snapshot from product if missing
  const quantity = toNumber(body.quantity);
  const unitPriceInput = toNumber(body.unitPrice); // optional (we can default to product.sellingPrice)
  const amountReceived = toNumber(body.amountReceived);

  // Optional inputs
  const salespersonId = body.salespersonId || null;
  const salespersonName = body.salespersonName || null;
  const syncStatus = body.syncStatus || "PENDING";

  // Optional idempotency/custom ID (helps offline sync)
  // If provided, we will use it as the Sales document ID (must be unique).
  const saleId = body.id || sdk.ID.unique();

  // Basic validation
  if (!shopId || !productId) {
    return json(res, { ok: false, message: "shopId and productId are required." }, 400);
  }
  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return json(res, { ok: false, message: "quantity must be a positive integer." }, 400);
  }
  if (amountReceived === null || amountReceived < 0) {
    return json(res, { ok: false, message: "amountReceived must be a number >= 0." }, 400);
  }

  // ENV requirements
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;

  const PRODUCTS_COLLECTION_ID = process.env.PRODUCTS_COLLECTION_ID;
  const SALES_COLLECTION_ID = process.env.SALES_COLLECTION_ID;
  const STOCKMOVEMENTS_COLLECTION_ID = process.env.STOCKMOVEMENTS_COLLECTION_ID;
  const NOTIFICATIONS_COLLECTION_ID = process.env.NOTIFICATIONS_COLLECTION_ID; // optional but recommended

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
    // 1) Fetch product
    const product = await db.getDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId);

    // Validate product belongs to shop
    if (product.shopId !== shopId) {
      return json(res, { ok: false, message: "Product does not belong to this shop." }, 403);
    }

    // Validate product status (optional enforcement)
    // If you want to allow selling even when INACTIVE, remove this.
    if (product.status && ["DISCONTINUED", "INACTIVE"].includes(product.status)) {
      return json(res, { ok: false, message: `Product status does not allow sale: ${product.status}` }, 409);
    }

    const currentQty = toNumber(product.quantity);
    if (currentQty === null) {
      return json(res, { ok: false, message: "Product quantity is invalid." }, 500);
    }
    if (currentQty < quantity) {
      return json(
        res,
        { ok: false, message: `Insufficient stock. Available: ${currentQty}, requested: ${quantity}` },
        409
      );
    }

    // Determine unitPrice (use input or product.sellingPrice)
    const fallbackUnitPrice = toNumber(product.sellingPrice);
    const unitPrice = unitPriceInput !== null ? unitPriceInput : fallbackUnitPrice;

    if (unitPrice === null || unitPrice < 0) {
      return json(res, { ok: false, message: "unitPrice is invalid (provide unitPrice or ensure product.sellingPrice is set)." }, 400);
    }

    // Compute totals
    const totalAmount = Number((quantity * unitPrice).toFixed(2));

    // Payment status logic
    let paymentStatus = "UNPAID";
    if (amountReceived >= totalAmount) paymentStatus = "PAID";
    else if (amountReceived > 0 && amountReceived < totalAmount) paymentStatus = "PARTIAL";

    // 2) Create Sale document (snapshot productName + pricing)
    const saleDoc = {
      id: saleId, // your schema includes id; Appwrite doc ID is separate, but we keep field for consistency if you want
      shopId,
      productId,
      productName: productNameInput || product.name || product.productName || "Unknown Product",
      quantity,
      unitPrice: Number(unitPrice.toFixed(2)),
      totalAmount,
      amountReceived: Number(amountReceived.toFixed(2)),
      paymentStatus,
      salespersonId,
      salespersonName,
      syncStatus,
      createdAt: nowIso
    };

    // Use saleId as the DOCUMENT ID so you can sync safely (offline-first).
    // If a duplicate is attempted, Appwrite will throw and we can return a safe response.
    await db.createDocument(DATABASE_ID, SALES_COLLECTION_ID, String(saleId), saleDoc);

    // 3) Create Stock Movement OUT (audit trail)
    const movementId = sdk.ID.unique();
    const movementDoc = {
      id: movementId,
      shopId,
      productId,
      productName: saleDoc.productName,
      type: "OUT",
      quantity,
      reason: "SALE",
      staffId: salespersonId,
      staffName: salespersonName,
      imageEvidence: null,
      syncStatus,
      createdAt: nowIso
    };

    await db.createDocument(DATABASE_ID, STOCKMOVEMENTS_COLLECTION_ID, movementId, movementDoc);

    // 4) Update Product quantity (+ status auto)
    const newQty = currentQty - quantity;

    const nextStatus = newQty === 0 ? "OUT_OF_STOCK" : (product.status || "ACTIVE");

    await db.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId, {
      quantity: newQty,
      status: nextStatus,
      productCount: product.productCount // keep if exists; no change
    });

    // 5) Optional: Low-stock notification
    // If you have notifications collection id set, we can generate an alert.
    const lowStockThreshold = toNumber(product.lowStockThreshold);
    if (NOTIFICATIONS_COLLECTION_ID && lowStockThreshold !== null && newQty <= lowStockThreshold) {
      const notifId = sdk.ID.unique();
      await db.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, {
        id: notifId,
        shopId,
        type: "BUSINESS",
        category: "STOCK",
        title: "Low Stock Alert",
        message: `${saleDoc.productName} is low in stock. Remaining: ${newQty}.`,
        severity: newQty === 0 ? "CRITICAL" : "WARNING",
        isRead: false,
        relatedId: productId,
        createdAt: nowIso
      });
    }

    // Success response
    return json(res, {
      ok: true,
      saleId: String(saleId),
      productId,
      previousQuantity: currentQty,
      newQuantity: newQty,
      paymentStatus
    });
  } catch (e) {
    // Handle duplicate saleId (idempotency)
    // If saleId already exists, return a safe "already processed" response
    const msg = (e && e.message) ? e.message : String(e);
    if (msg.toLowerCase().includes("document with the requested id already exists")) {
      return json(res, { ok: true, saleId: String(saleId), message: "Sale already processed (idempotent)." }, 200);
    }

    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to process sale", error: msg }, 500);
  }
}

// Wrapper to support older signature styles if needed
module.exports = async function (...args) {
  // New style: module.exports({ req, res, log, error })
  if (args.length === 1 && args[0] && args[0].req && args[0].res) {
    return handler(args[0]);
  }

  // Older style: module.exports(req, res)
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
