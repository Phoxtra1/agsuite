import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const action = payload.action as string | undefined;

    // ── Helper: find first admin user to route messages to ──
    async function findAdminUserId(): Promise<string | null> {
      // Get the first profile (admin/owner) to route public messages to
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data?.user_id ?? null;
    }

    // ── Support Ticket (public form, no auth required) ──────
    if (action === "support_ticket") {
      const { email, name, subject, message, priority, source_app } = payload;

      if (!email || !subject || !message) {
        return json({ error: "email, subject, and message are required" }, 400);
      }

      const adminId = await findAdminUserId();
      if (!adminId) return json({ error: "No admin user found to route ticket" }, 500);

      // 1. Create support ticket (using admin user_id for RLS)
      await supabase.from("support_tickets").insert({
        user_id: adminId,
        subject,
        message: `From: ${name || "Anonymous"} <${email}>\n\n${message}`,
        priority: priority || "normal",
        source_app: source_app || "ComsSystem",
      });

      // 2. Push to inbox so admin sees it in ComsSystem
      await supabase.from("inbound_messages").insert({
        user_id: adminId,
        sender: email,
        sender_name: name || email,
        subject: `Support: ${subject}`,
        body: message,
        channel: "email",
        type: "support",
        priority: priority || "normal",
        source_app: source_app || "ComsSystem",
      });

      // 3. Log the event
      await supabase.from("coms_logs").insert({
        user_id: adminId,
        event: "ticket-created",
        channel: "email",
        recipient: email,
        subject,
        source_app: source_app || "ComsSystem",
        message_type: "support",
        delivery_status: "received",
        details: `Public submission from ${name || email}`,
      });

      return json({ success: true, message: "Ticket submitted" });
    }

    // ── User Message (public contact form) ──────────────────
    if (action === "user_message") {
      const { email, name, subject, message, source_app } = payload;

      if (!email || !subject || !message) {
        return json({ error: "email, subject, and message are required" }, 400);
      }

      const adminId = await findAdminUserId();
      if (!adminId) return json({ error: "No admin user found" }, 500);

      await supabase.from("inbound_messages").insert({
        user_id: adminId,
        sender: email,
        sender_name: name || email,
        subject,
        body: message,
        channel: "email",
        type: "general",
        source_app: source_app || "external",
      });

      await supabase.from("coms_logs").insert({
        user_id: adminId,
        event: "user-message-received",
        channel: "email",
        recipient: email,
        subject,
        source_app: source_app || "external",
        message_type: "support",
        delivery_status: "received",
      });

      return json({ success: true });
    }

    // ── Legacy: Brevo inbound webhook ───────────────────────
    const {
      sender,
      subject,
      textContent,
      htmlContent,
      sourceApp,
      userId,
      channel = "email",
      type = "support",
      priority = "normal",
    } = payload;

    if (!sender?.email || !subject) {
      return json({ error: "sender.email and subject are required" }, 400);
    }

    let targetUserId = userId;

    if (!targetUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", sender.email)
        .limit(1)
        .maybeSingle();
      targetUserId = profile?.user_id;
    }

    if (!targetUserId) {
      // Fallback to admin
      targetUserId = await findAdminUserId();
    }

    if (!targetUserId) {
      return json({ success: true, warning: "No user to route to" });
    }

    await supabase.from("inbound_messages").insert({
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

    return json({ success: true });
  } catch (error) {
    console.error("coms-inbound error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});
