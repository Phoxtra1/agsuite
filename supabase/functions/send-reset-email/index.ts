import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { email, origin } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up user by email
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const user = userData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return new Response(
        JSON.stringify({ sent: true, message: "If an account exists, a reset email has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 1 token per 2 minutes
    const { data: recentToken } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("created_at")
      .eq("user_id", user.id)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentToken) {
      const elapsed = Date.now() - new Date(recentToken.created_at).getTime();
      if (elapsed < 120_000) {
        return new Response(
          JSON.stringify({ sent: false, message: "Please wait before requesting another email" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabaseAdmin.from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      email: user.email,
      expires_at: expiresAt,
    });

    const siteOrigin = origin || "https://amineva.com";
    const resetUrl = `${siteOrigin}/auth/reset-password?token=${token}`;
    const name = user.user_metadata?.name;

    const htmlContent = buildResetEmail(user.email!, resetUrl, name);

    // Send via Brevo
    const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        to: [{ email: user.email, name: name || user.email }],
        subject: "Reset your Amineva password",
        htmlContent,
        sender: { name: "Amineva", email: "noreply@amineva.com" },
        tags: ["password-reset", "auth"],
      }),
    });

    const sendResult = await sendRes.json();
    const event = sendRes.ok ? "delivered" : "failed";

    // Log to coms_logs
    await supabaseAdmin.from("coms_logs").insert({
      user_id: user.id,
      channel: "email",
      event,
      recipient: user.email,
      subject: "Reset your Amineva password",
      source_app: "AuthPasswordReset",
      message_type: "transactional",
      details: event === "failed"
        ? `Error: ${JSON.stringify(sendResult)}`
        : `messageId: ${sendResult.messageId || "n/a"}`,
    });

    return new Response(
      JSON.stringify({ sent: true, message: "If an account exists, a reset email has been sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-reset-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildResetEmail(email: string, resetUrl: string, name?: string): string {
  const greeting = name ? `Hi ${name}` : "Hi there";
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
      <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; border: 1px solid #e9ecef;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://raw.githubusercontent.com/AminEVA-Global/brand-assets/main/amv_global_logo.png"
               alt="Amineva" width="140" style="margin-bottom: 16px;" onerror="this.style.display='none'" />
          <h1 style="margin: 0; font-size: 22px; color: hsl(222, 47%, 11%);">Reset your password</h1>
        </div>

        <p style="color: hsl(220, 9%, 46%); font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          ${greeting}, we received a request to reset your Amineva account password. Click the button below to choose a new password.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: hsl(222, 47%, 11%); color: hsl(210, 40%, 98%);
                    padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;
                    font-size: 15px;">
            Reset Password
          </a>
        </div>

        <p style="color: hsl(220, 9%, 46%); font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: hsl(222, 47%, 11%); font-size: 12px; word-break: break-all; background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6;">
          ${resetUrl}
        </p>

        <p style="color: hsl(220, 9%, 46%); font-size: 12px; margin-top: 24px;">
          This link expires in 30 minutes. If you didn't request a password reset, you can safely ignore this email.
        </p>

        <p style="margin-top: 32px; color: #adb5bd; font-size: 11px; text-align: center;">
          Amineva Global Suite
        </p>
      </div>
    </div>
  `;
}
