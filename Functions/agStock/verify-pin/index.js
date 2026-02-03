/**
 * Appwrite Cloud Function — verify-pin
 *
 * Run-time: Node.js
 *
 * Purpose:
 * - Verify a submitted PIN for a user.
 * - Enforces failedAttempts and temporary lockouts.
 *
 * Environment variables required:
 * - APPWRITE_ENDPOINT
 * - APPWRITE_PROJECT
 * - APPWRITE_API_KEY (server key)
 * - DATABASE_ID
 * - PINS_COLLECTION_ID
 *
 * Payload (stdin JSON): { "userId":"...", "pin":"1234", "scope":"shop_owner" }
 *
 * NOTE:
 * - This function expects raw PIN from the client sent over TLS (HTTPS).
 * - This design keeps salts and KDF logic server-side.
 */

const { Client, Databases, Query } = require("node-appwrite");
const argon2 = require("argon2");

async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// Helper: returns ISO timestamp plus minutes
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000).toISOString();
}

(async function main() {
  try {
    const raw = (await readStdin()) || "{}";
    const payload = JSON.parse(raw);
    const { userId, pin, scope = "shop_owner" } = payload;

    if (!userId || !pin) {
      console.log(JSON.stringify({ ok: false, error: "Missing userId or pin" }));
      process.exit(0);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID;
    const COLLECTION_ID = process.env.PINS_COLLECTION_ID;

    // Fetch the user's PIN doc
    // Prefer using SDK Query helper if available: Query.equal("scope", scope) ...
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      // Query.equal("scope", scope),
      // Query.equal("userId", userId),
      // Query.limit(1),
    ], 1).catch(() => null);

    const doc = res && res.documents && res.documents.length ? res.documents[0] : null;

    if (!doc || !doc.pinHash) {
      console.log(JSON.stringify({ ok: false, error: "No PIN configured" }));
      process.exit(0);
    }

    // Check lockout
    const now = new Date();
    if (doc.lockedUntil) {
      const lockedUntil = new Date(doc.lockedUntil);
      if (lockedUntil > now) {
        console.log(JSON.stringify({ ok: false, error: "Account locked", lockedUntil: doc.lockedUntil }));
        process.exit(0);
      }
    }

    // Verify: we hashed pin as `${pin}:${userId}` when creating
    const toVerify = `${pin}:${userId}`;
    const isValid = await argon2.verify(doc.pinHash, toVerify).catch(() => false);

    if (isValid) {
      // Reset failed attempts
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date().toISOString(),
      });

      console.log(JSON.stringify({ ok: true, doc: updated }));
      process.exit(0);
    }

    // Invalid: increment counter and possibly lock
    const prev = doc.failedAttempts || 0;
    const next = prev + 1;
    let lockedUntil = doc.lockedUntil || null;
    const maxAttempts = 5;
    const lockMinutes = 15;

    if (next >= maxAttempts) {
      lockedUntil = addMinutes(new Date(), lockMinutes);
    }

    const updated = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
      failedAttempts: next,
      lockedUntil,
      updatedAt: new Date().toISOString(),
    });

    console.log(JSON.stringify({
      ok: false,
      error: "Invalid PIN",
      attempts: next,
      lockedUntil,
      doc: updated ? { $id: updated.$id } : null,
    }));
    process.exit(0);
  } catch (e) {
    console.error("verify-pin error:", e);
    console.log(JSON.stringify({ ok: false, error: String(e) }));
    process.exit(1);
  }
})();
