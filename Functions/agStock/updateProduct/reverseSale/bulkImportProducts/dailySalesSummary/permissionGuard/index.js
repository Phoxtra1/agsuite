// Appwrite Function: AGStock - permissionGuard
// Checks if an employee can perform a given action in a shop based on role + status.

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

function normalize(str) {
  return String(str || "").trim().toUpperCase();
}

// Role ranking for easy comparisons
const ROLE_RANK = {
  OWNER: 4,
  MANAGER: 3,
  CASHIER: 2,
  STAFF: 1
};

// Default action policy (you can edit anytime)
const ACTION_POLICY = {
  PROCESS_SALE: "CASHIER",        // CASHIER, MANAGER, OWNER
  ADJUST_STOCK: "MANAGER",        // MANAGER, OWNER
  CREATE_PRODUCT: "MANAGER",      // MANAGER, OWNER
  UPDATE_PRODUCT: "MANAGER",      // MANAGER, OWNER
  BULK_IMPORT_PRODUCTS: "MANAGER",// MANAGER, OWNER
  REVERSE_SALE: "MANAGER",        // MANAGER, OWNER
  DAILY_SALES_SUMMARY: "STAFF",   // STAFF+
  LOW_STOCK_CHECK: "STAFF"        // STAFF+
};

async function handler({ req, res, log, error }) {
  const body = parseBody(req);

  const shopId = body.shopId;
  const employeeId = body.employeeId || body.staffId;
  const action = normalize(body.action);

  if (!shopId || !employeeId || !action) {
    return json(
      res,
      { ok: false, allowed: false, message: "shopId, employeeId (or staffId), and action are required." },
      400
    );
  }

  const requiredRole = normalize(body.requiredRole) || ACTION_POLICY[action] || null;
  if (!requiredRole) {
    return json(
      res,
      { ok: false, allowed: false, message: `Unknown action: ${action}. Provide requiredRole or add it to policy.` },
      400
    );
  }

  if (!ROLE_RANK[requiredRole]) {
    return json(
      res,
      { ok: false, allowed: false, message: `Invalid requiredRole: ${requiredRole}` },
      400
    );
  }

  // ENV
  const ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const API_KEY = process.env.APPWRITE_API_KEY;

  const DATABASE_ID = process.env.DATABASE_ID;
  const EMPLOYEES_COLLECTION_ID = process.env.EMPLOYEES_COLLECTION_ID;

  if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
    return json(res, { ok: false, allowed: false, message: "Missing Appwrite env: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_API_KEY" }, 500);
  }
  if (!DATABASE_ID || !EMPLOYEES_COLLECTION_ID) {
    return json(res, { ok: false, allowed: false, message: "Missing env: DATABASE_ID, EMPLOYEES_COLLECTION_ID" }, 500);
  }

  const client = new sdk.Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new sdk.Databases(client);

  try {
    // Prefer direct getDocument if you use employee docId as employeeId.
    // If you use a different ID scheme, we fall back to search by fields.
    let employee = null;

    try {
      employee = await db.getDocument(DATABASE_ID, EMPLOYEES_COLLECTION_ID, String(employeeId));
    } catch (_) {
      // fallback: search by shopId + staffId fields (if you store that way)
      const found = await db.listDocuments(DATABASE_ID, EMPLOYEES_COLLECTION_ID, [
        sdk.Query.equal("shopId", shopId),
        sdk.Query.equal("id", String(employeeId)),
        sdk.Query.limit(1)
      ]);
      employee = (found.documents || [])[0] || null;
    }

    if (!employee) {
      return json(res, { ok: true, allowed: false, message: "Employee not found." }, 403);
    }

    if (employee.shopId !== shopId) {
      return json(res, { ok: true, allowed: false, message: "Employee does not belong to this shop." }, 403);
    }

    const status = normalize(employee.status);
    if (status !== "ACTIVE") {
      return json(res, { ok: true, allowed: false, message: `Employee status is not ACTIVE: ${status}` }, 403);
    }

    const role = normalize(employee.role);
    if (!ROLE_RANK[role]) {
      return json(res, { ok: true, allowed: false, message: `Employee role is invalid: ${role}` }, 403);
    }

    const allowed = ROLE_RANK[role] >= ROLE_RANK[requiredRole];

    return json(res, {
      ok: true,
      allowed,
      shopId,
      employeeId: String(employeeId),
      action,
      role,
      requiredRole
    });
  } catch (e) {
    const msg = e?.message ? e.message : String(e);
    if (error) error(msg);
    else if (log) log(msg);

    return json(res, { ok: false, allowed: false, message: "Permission check failed", error: msg }, 500);
  }
}

module.exports = async function (...args) {
  if (args.length === 1 && args[0] && args[0].req && args[0].res) return handler(args[0]);
  const req = args[0];
  const res = args[1];
  return handler({ req, res, log: console.log, error: console.error });
};
