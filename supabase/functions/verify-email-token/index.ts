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

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ verified: false, error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up token
    const { data: record, error: lookupErr } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .maybeSingle();

    if (lookupErr || !record) {
      return new Response(JSON.stringify({ verified: false, error: "Invalid or expired token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return new Response(JSON.stringify({ verified: false, error: "Token expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ email_verified: true })
      .eq("user_id", record.user_id);

    // Log to coms_logs
    await supabaseAdmin.from("coms_logs").insert({
      user_id: record.user_id,
      channel: "email",
      event: "clicked",
      recipient: record.email,
      subject: "Email verified",
      source_app: "AuthVerification",
      message_type: "transactional",
      details: "User verified their email address",
    });

    return new Response(
      JSON.stringify({ verified: true, message: "Email verified successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[verify-email-token] Error:", error);
    return new Response(
      JSON.stringify({ verified: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
