import { Client, Databases } from "node-appwrite";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const json = (status, body, headers = {}) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json",
    ...headers,
  },
  body: JSON.stringify(body),
});

const getBody = (req) => {
  try { return req.body ? JSON.parse(req.body) : {}; } catch { return {}; }
};

const sha256hex = async (input) => {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
};

// --- JWT session for employees (HttpOnly cookie) ---
const COOKIE_NAME = "agstock_emp";
const jwtSecret = () => new TextEncoder().encode(process.env.EMP_JWT_SECRET || "CHANGE_ME");

async function signEmployeeJWT(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

async function readEmployeeJWT(req) {
  const cookie = req.headers?.cookie || req.headers?.Cookie || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  try {
    const token = decodeURIComponent(match[1]);
    const { payload } = await jwtVerify(token, jwtSecret());
    return payload;
  } catch {
    return null;
  }
}

function setCookie(token) {
  // Secure should be true in production HTTPS
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

// --- Appwrite client ---
function getDb() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  return db;
}

const DB_ID = process.env.APPWRITE_DB_ID;
const COL_EMPLOYEES = process.env.COL_EMPLOYEES || "employees";
const COL_INVITES = process.env.COL_INVITES || "invites";

export default async ({ req, res, log, error }) => {
  try {
    const db = getDb();
    const path = req.path || "/";
    const method = (req.method || "GET").toUpperCase();

    // Basic CORS (adjust your allowed origin)
    const corsHeaders = {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    };

    if (method === "OPTIONS") {
      return res.send("", 204, corsHeaders);
    }

    // -----------------------------
    // 1) POST /invite/accept
    // -----------------------------
    if (path === "/invite/accept" && (method === "GET" || method === "POST")) {
      const token =
        req.query?.token ||
        getBody(req).token;

      if (!token) return res.json({ error: "Missing token" }, 400, corsHeaders);

      const tokenHash = await sha256hex(token);

      // Find invite by tokenHash
      // NOTE: Appwrite query requires you to use Queries; for brevity,
      // use Databases.listDocuments with query in your real code.
      // Here’s the correct pattern:
      const { Query } = await import("node-appwrite");
      const invites = await db.listDocuments(DB_ID, COL_INVITES, [
        Query.equal("tokenHash", tokenHash),
        Query.limit(1),
      ]);

      if (!invites.documents.length) {
        return res.json({ error: "Invalid invite token" }, 400, corsHeaders);
      }

      const invite = invites.documents[0];

      // Check expiry + used
      const now = new Date();
      const expiresAt = new Date(invite.expiresAt);
      if (invite.usedAt) return res.json({ error: "Invite already used" }, 400, corsHeaders);
      if (expiresAt.getTime() < now.getTime()) return res.json({ error: "Invite expired" }, 400, corsHeaders);

      // Create or find employee
      const { Query } = await import("node-appwrite");
      const employees = await db.listDocuments(DB_ID, COL_EMPLOYEES, [
        Query.equal("shopId", invite.shopId),
        Query.equal("email", invite.email.toLowerCase()),
        Query.limit(1),
      ]);

      let employeeDoc;

      if (employees.documents.length) {
        employeeDoc = employees.documents[0];
        // update role/permissions in case they changed before acceptance
        employeeDoc = await db.updateDocument(DB_ID, COL_EMPLOYEES, employeeDoc.$id, {
          roleName: invite.roleName,
          permissions: invite.permissions,
          status: "active",
        });
      } else {
        employeeDoc = await db.createDocument(DB_ID, COL_EMPLOYEES, "unique()", {
          shopId: invite.shopId,
          email: invite.email.toLowerCase(),
          displayName: "",
          phone: "",
          roleName: invite.roleName,
          permissions: invite.permissions,
          pinHash: "",
          status: "active",
        });
      }

      // Mark invite used
      await db.updateDocument(DB_ID, COL_INVITES, invite.$id, {
        usedAt: now.toISOString(),
      });

      // Create employee session cookie
      const jwt = await signEmployeeJWT({
        employeeId: employeeDoc.$id,
        shopId: employeeDoc.shopId,
      });

      const pinSet = Boolean(employeeDoc.pinHash);
      const profileComplete = Boolean(employeeDoc.displayName && employeeDoc.displayName.trim().length >= 2);

      return res.json(
        {
          employeeId: employeeDoc.$id,
          shopId: employeeDoc.shopId,
          roleName: employeeDoc.roleName,
          permissions: employeeDoc.permissions,
          pinSet,
          profileComplete,
        },
        200,
        {
          ...corsHeaders,
          "Set-Cookie": setCookie(jwt),
        }
      );
    }

    // -----------------------------
    // 2) POST /employee/pin
    // -----------------------------
    if (path === "/employee/pin" && method === "POST") {
      const body = getBody(req);
      const token = body.token;
      const pin = String(body.pin || "");

      if (!token) return res.json({ error: "Missing token" }, 400, corsHeaders);
      if (!/^\d{4}$/.test(pin)) return res.json({ error: "PIN must be 4 digits" }, 400, corsHeaders);

      const tokenHash = await sha256hex(token);

      const { Query } = await import("node-appwrite");
      const invites = await db.listDocuments(DB_ID, COL_INVITES, [
        Query.equal("tokenHash", tokenHash),
        Query.limit(1),
      ]);
      if (!invites.documents.length) return res.json({ error: "Invalid token" }, 400, corsHeaders);

      const invite = invites.documents[0];

      // Find employee by shopId+email
      const employees = await db.listDocuments(DB_ID, COL_EMPLOYEES, [
        Query.equal("shopId", invite.shopId),
        Query.equal("email", invite.email.toLowerCase()),
        Query.limit(1),
      ]);
      if (!employees.documents.length) return res.json({ error: "Employee not found" }, 404, corsHeaders);

      const employee = employees.documents[0];
      if (employee.status !== "active") return res.json({ error: "Account disabled" }, 403, corsHeaders);

      // Hash PIN
      const pinHash = await bcrypt.hash(pin, 10);

      await db.updateDocument(DB_ID, COL_EMPLOYEES, employee.$id, {
        pinHash,
      });

      return res.json({ ok: true }, 200, corsHeaders);
    }

    // -----------------------------
    // 3) POST /employee/profile
    // -----------------------------
    if (path === "/employee/profile" && method === "POST") {
      const session = await readEmployeeJWT(req);
      if (!session?.employeeId) return res.json({ error: "Not authenticated" }, 401, corsHeaders);

      const body = getBody(req);
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();

      if (name.length < 2) return res.json({ error: "Name is required" }, 400, corsHeaders);

      await db.updateDocument(DB_ID, COL_EMPLOYEES, session.employeeId, {
        displayName: name,
        phone: phone || "",
      });

      return res.json({ ok: true }, 200, corsHeaders);
    }

    // -----------------------------
    // 4) GET /employee/me
    // -----------------------------
    if (path === "/employee/me" && method === "GET") {
      const session = await readEmployeeJWT(req);
      if (!session?.employeeId) return res.json({ error: "Not authenticated" }, 401, corsHeaders);

      const employee = await db.getDocument(DB_ID, COL_EMPLOYEES, session.employeeId);

      const pinSet = Boolean(employee.pinHash);
      const profileComplete = Boolean(employee.displayName && employee.displayName.trim().length >= 2);

      return res.json(
        {
          shopId: employee.shopId,
          employeeId: employee.$id,
          roleName: employee.roleName,
          permissions: employee.permissions,
          displayName: employee.displayName,
          pinSet,
          profileComplete,
          status: employee.status,
        },
        200,
        corsHeaders
      );
    }

    return res.json({ error: "Not found" }, 404, corsHeaders);
  } catch (e) {
    return res.json({ error: String(e?.message || e) }, 500);
  }
};
