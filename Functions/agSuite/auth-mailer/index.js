import { Client, Users, Query } from "node-appwrite";

const json = (statusCode, obj) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(obj),
});

export default async ({ req, log, error }) => {
  try {
    // ---- Read env ----
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
    const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME;
    const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL;

    const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
    const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

    const missing = [
      ["BREVO_API_KEY", BREVO_API_KEY],
      ["BREVO_SENDER_EMAIL", BREVO_SENDER_EMAIL],
      ["BREVO_SENDER_NAME", BREVO_SENDER_NAME],
      ["APP_PUBLIC_URL", APP_PUBLIC_URL],
      ["APPWRITE_ENDPOINT", APPWRITE_ENDPOINT],
      ["APPWRITE_PROJECT_ID", APPWRITE_PROJECT_ID],
      ["APPWRITE_API_KEY", APPWRITE_API_KEY],
    ].filter(([, v]) => !v);

    if (missing.length) {
      return json(500, {
        ok: false,
        error: `Missing env vars: ${missing.map(([k]) => k).join(", ")}`,
      });
    }

    // ---- Parse body ----
    const body = (() => {
      try {
        return req.body ? JSON.parse(req.body) : {};
      } catch {
        return {};
      }
    })();

    const email = (body.email || "").trim().toLowerCase();
    const redirectPath = (body.redirectPath || "/suite/auth/callback").trim();

    if (!email) return json(400, { ok: false, error: "email is required" });
    if (!redirectPath.startsWith("/"))
      return json(400, { ok: false, error: "redirectPath must start with /" });

    // ---- Appwrite server client ----
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const users = new Users(client);

    // ---- Find or create user by email ----
    let user;
    const found = await users.list([Query.equal("email", email), Query.limit(1)]);
    if (found.total > 0) {
      user = found.users[0];
    } else {
      // Create user WITHOUT password (passwordless magic link system)
      // userId must be unique; let Appwrite generate unique ID-like value:
      // NOTE: node-appwrite doesn't expose ID.unique in older versions; using a simple random is fine.
      const userId = `u_${crypto.randomUUID()}`;
      user = await users.create(userId, email);
    }

    // ---- Create login token (custom token) ----
    // Appwrite will return a token secret we can deliver via Brevo.
    const token = await users.createToken(user.$id);

    // ---- Build login link ----
    const callbackUrl =
      `${APP_PUBLIC_URL}${redirectPath}` +
      `?userId=${encodeURIComponent(user.$id)}` +
      `&secret=${encodeURIComponent(token.secret)}`;

    // ---- Send email via Brevo transactional API ----
    const subject = "Your AG Suite sign-in link";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height:1.5">
        <h2>Sign in to AG Suite</h2>
        <p>Click the button below to sign in. This link expires and can only be used once.</p>
        <p style="margin: 18px 0;">
          <a href="${callbackUrl}"
             style="display:inline-block;padding:12px 16px;text-decoration:none;border-radius:8px;background:#111827;color:#ffffff;">
            Sign in
          </a>
        </p>
        <p>If you didn’t request this, you can ignore this email.</p>
      </div>
    `;

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject,
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const brevoErr = await brevoRes.text();
      error("Brevo error:", brevoErr);
      return json(502, { ok: false, error: "Brevo send failed", details: brevoErr });
    }

    log("Magic link sent:", email);
    return json(200, { ok: true });
  } catch (e) {
    error("Function error:", e?.message || String(e));
    return json(500, { ok: false, error: e?.message || "Unknown error" });
  }
};
