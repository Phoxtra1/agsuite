/**
 * AG Suite gateway function (self-hosted Appwrite).
 *
 * Handles Admin Seal credentials: IDs + hashed PINs live in the
 * `admin_credentials` collection, which the browser can never read or write.
 * Dependency-free: talks to the Appwrite REST API with the function's
 * dynamic key, so no npm install / SDK version drift is involved.
 */
import crypto from "node:crypto";

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = (len) =>
  Array.from(crypto.randomBytes(len)).map((b) => ID_CHARS[b % ID_CHARS.length]).join("");
const randomSalt = () => crypto.randomBytes(16).toString("hex");
const hashPin = (salt, pin) => crypto.createHash("sha256").update(`${salt}${pin}`).digest("hex");
const COL = "admin_credentials";

function makeApi(req) {
  const endpoint =
    process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || "https://cloud.phoxtra.com/v1";
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID || "amineva";
  const key = req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY || "";
  const dbId = process.env.SUITE_DB_ID || "amineva-db";
  const base = `${endpoint}/databases/${dbId}/collections/${COL}/documents`;

  async function call(method, url, body) {
    const r = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": project,
        "X-Appwrite-Key": key,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) throw new Error((data && data.message) || `Appwrite ${r.status}`);
    return data;
  }

  return {
    async findBy(field, value) {
      const q = encodeURIComponent(JSON.stringify({ method: "equal", attribute: field, values: [value] }));
      const l = encodeURIComponent(JSON.stringify({ method: "limit", values: [1] }));
      const res = await call("GET", `${base}?queries[]=${q}&queries[]=${l}`);
      return res?.documents?.[0] || null;
    },
    create(data) {
      return call("POST", base, { documentId: crypto.randomUUID().replace(/-/g, "").slice(0, 20), data, permissions: [] });
    },
    update(id, data) {
      return call("PATCH", `${base}/${id}`, { data });
    },
  };
}

export default async ({ req, res, log, error }) => {
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.bodyJson || req.body || {};
  } catch {
    body = {};
  }
  const action = body.action || (req.path || "").replace(/^\//, "") || "ping";

  if (action === "ping") return res.json({ ok: true, service: "agsuite" });

  if (body.scope !== "admin-seal-auth") {
    // Other gateway actions are not used by the Suite UI any more.
    return res.json({ success: true, actionExecuted: action });
  }

  try {
    const api = makeApi(req);

    const findByIdentifier = async (identifier) => {
      const upper = String(identifier || "").trim().toUpperCase();
      if (!upper) return null;
      return (await api.findBy("adminId", upper)) || (await api.findBy("recoveryId", upper));
    };

    const createCredential = async (position, pin, adminId, recoveryId) => {
      const salt = randomSalt();
      return api.create({
        adminId: adminId || `AMV-SEC-${randomCode(6)}`,
        recoveryId: recoveryId || `AMV-REC-${randomCode(8)}`,
        position: String(position || "System Administrator").slice(0, 200),
        pinSalt: salt,
        pinHash: hashPin(salt, String(pin || "")),
        failedAttempts: 0,
        lockedUntil: "",
        createdAt: new Date().toISOString(),
      });
    };

    const publicCred = (doc) => ({
      id: doc.adminId,
      recoveryId: doc.recoveryId,
      position: doc.position,
      createdAt: doc.createdAt,
    });

    if (action === "id-create") {
      const pin = String(body.pin || "");
      if (!/^\d{4,12}$/.test(pin)) return res.json({ error: "PIN must be 4–12 digits." }, 400);
      const doc = await createCredential(body.position, pin);
      log(`Seal credential created: ${doc.adminId}`);
      return res.json({ success: true, credential: publicCred(doc) });
    }

    if (action === "id-migrate") {
      const list = Array.isArray(body.credentials) ? body.credentials.slice(0, 20) : [];
      for (const c of list) {
        if (!c?.id || !c?.pin) continue;
        if (!(await findByIdentifier(c.id))) {
          await createCredential(c.position, c.pin, String(c.id).toUpperCase(), String(c.recoveryId || "").toUpperCase() || undefined).catch(() => null);
        }
      }
      return res.json({ success: true, migrated: list.length });
    }

    if (action === "id-login") {
      const doc = await findByIdentifier(body.identifier);
      if (!doc) return res.json({ success: false, error: "Unrecognised Admin ID." }, 401);

      if (doc.lockedUntil && new Date(doc.lockedUntil).getTime() > Date.now()) {
        return res.json({ success: false, error: "Locked after too many attempts. Try again later." }, 423);
      }

      const ok = doc.pinHash === hashPin(doc.pinSalt, String(body.pin || ""));
      if (!ok) {
        const attempts = (doc.failedAttempts || 0) + 1;
        await api.update(doc.$id, {
          failedAttempts: attempts,
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : "",
        }).catch(() => null);
        return res.json({
          success: false,
          error: attempts >= 5 ? "Locked for 15 minutes after 5 failed attempts." : "Incorrect PIN.",
        }, 401);
      }

      await api.update(doc.$id, { failedAttempts: 0, lockedUntil: "", lastLoginAt: new Date().toISOString() }).catch(() => null);
      return res.json({ success: true, token: crypto.randomBytes(24).toString("hex"), credential: publicCred(doc) });
    }

    return res.json({ error: "Unsupported admin action." }, 400);
  } catch (err) {
    error(`Seal error: ${err?.message || err}`);
    return res.json({ error: "Admin service error. Please try again." }, 500);
  }
};
