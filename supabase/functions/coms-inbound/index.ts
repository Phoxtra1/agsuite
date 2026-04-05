import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const payload = await req.json();

    // Brevo inbound webhook payload format
    const {
      sender,       // { email, name }
      subject,
      textContent,
      htmlContent,
      sourceApp,    // custom header or tag
      userId,       // target user to deliver to (from X-Amineva-User header or tag)
      channel = "email",
      type = "support",
      priority = "normal",
    } = payload;

    if (!sender?.email || !subject) {
      return new Response(
        JSON.stringify({ error: "sender.email and subject are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If userId is provided, insert directly for that user
    // Otherwise, look up user by email or insert for all admins
    let targetUserId = userId;

    if (!targetUserId) {
      // Try to find a user with this email in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", sender.email)
        .limit(1)
        .maybeSingle();

      targetUserId = profile?.user_id;
    }

    if (!targetUserId) {
      // Fallback: log the inbound but can't route to a specific user
      console.warn("No target user found for inbound message from:", sender.email);
      return new Response(
        JSON.stringify({ success: true, warning: "Message received but no user to route to" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into inbound_messages
    const { error: insertError } = await supabase.from("inbound_messages").insert({
      user_id: targetUserId,
      sender: sender.email,
      sender_name: sender.name || sender.email,
      subject,
      body: htmlContent || textContent || "",
      channel,
      type,
      priority,
      source_app: sourceApp || "external",
    });

    if (insertError) {
      console.error("Failed to insert inbound message:", insertError);
      throw insertError;
    }

    // Also log to coms_logs
    await supabase.from("coms_logs").insert({
      user_id: targetUserId,
      event: "received",
      channel,
      recipient: sender.email,
      subject,
      source_app: sourceApp || "external",
      message_type: "support",
      delivery_status: "received",
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("coms-inbound error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
