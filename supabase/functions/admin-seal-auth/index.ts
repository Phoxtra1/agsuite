import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowlisted admin emails (max 3)
const ADMIN_EMAILS = [
  "admin@amineva.com",
  "oap@amineva.com",
  "info.amineva@gmail.com",
];

function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (const byte of arr) {
    otp += digits[byte % 10];
  }
  return otp;
}

function buildOtpHtml(otp: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;text-align:center;">
      <h2 style="color:#1a1f36;margin-bottom:8px;">Verification Code</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Use this code to continue. It expires in 10 minutes.</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1a1f36;">${otp}</span>
      </div>
      <p style="color:#9ca3af;font-size:12px;">If you did not request this, ignore this email.</p>
    </div>
  `;
}

async function sendViaComsSystem(
  supabaseUrl: string,
  serviceRoleKey: string,
  recipient: string,
  otp: string,
): Promise<{ success: true; messageId?: string } | { success: false; error: string }> {
  let lastError = "Unknown email delivery error";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: [{ email: recipient }],
          subject: "Your verification code",
          htmlContent: buildOtpHtml(otp),
          sender: { name: "Amineva Suite", email: "noreply@amineva.com" },
          tags: ["admin-seal-otp"],
        }),
      });

      const raw = await response.text();
      const parsed = raw ? JSON.parse(raw) : {};

      if (response.ok && parsed?.success) {
        return { success: true, messageId: parsed?.messageId };
      }

      lastError = parsed?.error || parsed?.message || `send-email HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "send-email request failed";
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  return { success: false, error: lastError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { action, email, code } = await req.json();

    // ──────── REQUEST OTP ────────
    if (action === "request") {
      if (!email || typeof email !== "string") {
        return new Response(
          JSON.stringify({ error: "Email not valid" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalised = email.trim().toLowerCase();

      if (!ADMIN_EMAILS.includes(normalised)) {
        return new Response(
          JSON.stringify({ error: "Email not valid" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Invalidate any existing unused codes for this email
      await supabase
        .from("admin_otp_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("email", normalised)
        .is("used_at", null);

      // Generate new code
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabase.from("admin_otp_codes").insert({
        email: normalised,
        code: otp,
        expires_at: expiresAt,
      });

      // Send via ComsSystem (send-email edge function) with retries
      const sendResult = await sendViaComsSystem(
        supabaseUrl,
        serviceRoleKey,
        normalised,
        otp,
      );

      if (!sendResult.success) {
        console.error("send-email error:", sendResult.error);
        return new Response(
          JSON.stringify({ error: "Failed to send verification email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log to coms_logs (best-effort, no user_id for admin seal)
      try {
        await supabase.from("coms_logs").insert({
          recipient: normalised,
          channel: "email",
          event: "delivered",
          subject: "Admin Seal OTP",
          source_app: "ComsSystem",
          message_type: "transactional",
          details: "Seal authentication OTP sent",
          user_id: "00000000-0000-0000-0000-000000000000",
          brevo_message_id: sendResult.messageId || null,
          delivery_status: "sent",
        });
      } catch { /* best-effort */ }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────── VERIFY OTP ────────
    if (action === "verify") {
      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: "Invalid request" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalised = email.trim().toLowerCase();

      const { data: otpRows } = await supabase
        .from("admin_otp_codes")
        .select("*")
        .eq("email", normalised)
        .eq("code", code)
        .is("used_at", null)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!otpRows || otpRows.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as used
      await supabase
        .from("admin_otp_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", otpRows[0].id);

      // Generate session token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const sessionToken = Array.from(tokenBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return new Response(
        JSON.stringify({ success: true, token: sessionToken, email: normalised }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("admin-seal-auth error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
