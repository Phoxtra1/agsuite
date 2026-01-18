// Appwrite Function: AGStock - adjustStock
// Creates a stockMovements record and updates product quantity safely.

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

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  // Required inputs
  const shopId = body.shopId;
  const productId = body.productId;
  const type = (body.type || "").toUpperCase(); // IN | OUT | ADJUSTMENT
  const quantity = toNumber(body.quantity);

  // Optional inputs
  const reason = body.reason || null;
  const staffId = body.staffId || null;
  const staffName = body.staffName || null;
  const imageEvidence = body.imageEvidence || null;
  const syncStatus = body.syncStatus || "PENDING";

  // Optional idempotency/custom ID (helps offline sync)
  const movementId = body.id || sdk.ID.unique();

  // Validation
  if (!shopId || !productId) {
    return json(res, { ok: false, message: "shopId and productId are required." }, 400);
  }
  if (!type || !["IN", "OUT", "ADJUSTMENT"].includes(type)) {
    return json(res, { ok: false, message: "type must be one of: IN, OUT, ADJUSTMENT." }, 400);
  }
  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return json(res, { ok: false, message: "quantity must be a positive integer." }, 400);
  }

  // ENV requirements
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;
  const PRODUCTS_COLLECTION_ID = process.env.PRODUCTS_COLLECTION_ID;
  const STOCKMOVEMENTS_COLLECTION_ID = process.env.STOCKMOVEMENTS_COLLECTION_ID;
  const NOTIFICATIONS_COLLECTION_ID = process.env.NOTIFICATIONS_COLLECTION_ID; // optional

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    return json(res, { ok: false, message: "Missing Appwrite env: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_API_KEY" }, 500);
  }
  if (!DATABASE_ID || !PRODUCTS_COLLECTION_ID || !STOCKMOVEMENTS_COLLECTION_ID) {
    return json(
      res,
      { ok: false, message: "Missing env: DATABASE_ID, PRODUCTS_COLLECTION_ID, STOCKMOVEMENTS_COLLECTION_ID (and optionally NOTIFICATIONS_COLLECTION_ID)." },
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

    const currentQty = toNumber(product.quantity);
    if (currentQty === null) {
      return json(res, { ok: false, message: "Product quantity is invalid." }, 500);
    }

    // 2) Determine new quantity
    // NOTE: quantity is always positive; direction is via type
    let newQty = currentQty;

    if (type === "IN") {
      newQty = currentQty + quantity;
    } else if (type === "OUT") {
      newQty = currentQty - quantity;
    } else if (type === "ADJUSTMENT") {
      // Adjustment can represent either correction up or down.
      // We use 'quantity' plus 'reason' to describe the correction.
      // Default behavior: treat ADJUSTMENT as an IN if reason suggests increase, else OUT.
      // But we do NOT guess; we require a direction field if you want exact control.
      //
      // To keep it deployment-safe and deterministic:
      // If body.adjustmentDirection provided: "IN" or "OUT"
      // Else: reject and ask for it.
      const adjustmentDirection = (body.adjustmentDirection || "").toUpperCase();
      if (!["IN", "OUT"].includes(adjustmentDirection)) {
        return json(
          res,
          { ok: false, message: "For type=ADJUSTMENT, provide adjustmentDirection: IN or OUT." },
          400
        );
      }
      newQty = adjustmentDirection === "IN" ? currentQty + quantity : currentQty - quantity;
    }

    // Block negative stock
    if (newQty < 0) {
      return json(
        res,
        { ok: false, message: `Stock cannot go negative. Current: ${currentQty}, requested change would result in: ${newQty}` },
        409
      );
    }

    // 3) Create Stock Movement record (audit log)
    const movementDoc = {
      id: String(movementId),
      shopId,
      productId,
      productName: product.name || product.productName || "Unknown Product",
      type,
      quantity,
      reason,
      staffId,
      staffName,
      imageEvidence,
      syncStatus,
      createdAt: nowIso
    };

    await db.createDocument(DATABASE_ID, STOCKMOVEMENTS_COLLECTION_ID, String(movementId), movementDoc);

    // 4) Update product quantity + status
    let nextStatus = product.status || "ACTIVE";

    if (newQty === 0) nextStatus = "OUT_OF_STOCK";
    else if (newQty > 0 && nextStatus === "OUT_OF_STOCK") nextStatus = "ACTIVE";

    await db.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, productId, {
      quantity: newQty,
      status: nextStatus
    });

    // 5) Optional: Notifications (low stock / out of stock)
    const lowStockThreshold = toNumber(product.lowStockThreshold);

    if (NOTIFICATIONS_COLLECTION_ID) {
      // Out of stock
      if (newQty === 0) {
        const notifId = sdk.ID.unique();
        await db.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, {
          id: notifId,
          shopId,
          type: "BUSINESS",
          category: "STOCK",
          title: "Out of Stock",
          message: `${movementDoc.productName} is now out of stock.`,
          severity: "CRITICAL",
          isRead: false,
          relatedId: productId,
          createdAt: nowIso
        });
      }

      // Low stock
      if (lowStockThreshold !== null && newQty > 0 && newQty <= lowStockThreshold) {
        const notifId = sdk.ID.unique();
        await db.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, notifId, {
          id: notifId,
          shopId,
          type: "BUSINESS",
          category: "STOCK",
          title: "Low Stock Alert",
          message: `${movementDoc.productName} is low in stock. Remaining: ${newQty}.`,
          severity: "WARNING",
          isRead: false,
          relatedId: productId,
          createdAt: nowIso
        });
      }
    }

    return json(res, {
      ok: true,
      movementId: String(movementId),
      productId,
      previousQuantity: currentQty,
      newQuantity: newQty,
      status: nextStatus
    });
  } catch (e) {
    // Handle duplicate movementId (idempotency)
    const msg = (e && e.message) ? e.message : String(e);
    if (msg.toLowerCase().includes("document with the requested id already exists")) {
      return json(res, { ok: true, movementId: String(movementId), message: "Stock movement already recorded (idempotent)." }, 200);
    }

    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, message: "Failed to adjust stock", error: msg }, 500);
  }
}

// Wrapper to support older signature styles if needed
module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) {
    return handler(args[0]);
  }
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
