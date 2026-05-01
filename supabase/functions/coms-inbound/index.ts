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

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

    async function getRequester() {
      const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return null;
      const { data } = await supabase.auth.getUser(token);
      return data.user ?? null;
    }

    async function sendBrevoEmail(opts: { to: { email: string; name?: string }[]; subject: string; htmlContent: string; tags?: string[] }) {
      const apiKey = Deno.env.get("BREVO_API_KEY");
      if (!apiKey) throw new Error("Email service is not configured");
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          sender: { name: "Amineva Support", email: "noreply@amineva.com" },
          to: opts.to,
          subject: opts.subject,
          htmlContent: opts.htmlContent,
          tags: opts.tags ?? ["coms-reply"],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`Email delivery failed: ${JSON.stringify(data)}`);
      return data as { messageId?: string };
    }

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
      const requester = await getRequester();

      // 1. Create support ticket (using admin user_id for RLS)
      const { data: ticket, error: ticketError } = await supabase.from("support_tickets").insert({
        user_id: adminId,
        sender_user_id: requester?.id ?? null,
        sender_email: email,
        sender_name: name || email,
        subject,
        message: `From: ${name || "Anonymous"} <${email}>\n\n${message}`,
        priority: priority || "normal",
        source_app: source_app || "ComsSystem",
      }).select("id").single();
      if (ticketError) return json({ error: ticketError.message }, 500);

      // 2. Push to inbox so admin sees it in ComsSystem
      await supabase.from("inbound_messages").insert({
        user_id: adminId,
        sender_user_id: requester?.id ?? null,
        target_user_id: adminId,
        related_ticket_id: ticket?.id ?? null,
        direction: "inbound",
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

    // ── Central reply from ComsSystem to a customer or team member ──────
    if (action === "reply") {
      const requester = await getRequester();
      if (!requester) return json({ error: "Authentication required to send replies" }, 401);

      const recipientEmail = cleanText(payload.recipient_email);
      const recipientName = cleanText(payload.recipient_name, recipientEmail || "Recipient");
      const targetUserId = cleanText(payload.target_user_id);
      const subject = cleanText(payload.subject);
      const message = cleanText(payload.message);
      const sourceApp = cleanText(payload.source_app, "ComsSystem");
      const relatedTicketId = cleanText(payload.ticket_id);
      const replyToMessageId = cleanText(payload.reply_to_message_id);

      if (!subject || !message || (!recipientEmail && !targetUserId)) {
        return json({ error: "subject, message, and a recipient email or target user are required" }, 400);
      }

      let emailResult: { messageId?: string } | null = null;
      if (recipientEmail) {
        emailResult = await sendBrevoEmail({
          to: [{ email: recipientEmail, name: recipientName }],
          subject,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;line-height:1.6"><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"><p style="color:#64748b;font-size:12px">Amineva Support Team</p></div>`,
          tags: ["coms-reply", sourceApp.toLowerCase()],
        });
      }

      await supabase.from("inbound_messages").insert({
        user_id: targetUserId || requester.id,
        sender_user_id: requester.id,
        target_user_id: targetUserId || null,
        related_ticket_id: relatedTicketId || null,
        reply_to_message_id: replyToMessageId || null,
        direction: "outbound",
        sender: requester.email ?? "support@amineva.com",
        sender_name: requester.user_metadata?.name ?? "Amineva Support",
        subject,
        body: message,
        channel: recipientEmail ? "email" : "in-app",
        type: "support",
        priority: "normal",
        source_app: sourceApp,
        is_read: false,
      });

      if (relatedTicketId) {
        await supabase.from("support_tickets").update({ status: "replied", last_replied_at: new Date().toISOString() }).eq("id", relatedTicketId);
      }

      await supabase.from("coms_logs").insert({
        user_id: requester.id,
        event: "reply-sent",
        channel: recipientEmail ? "email" : "in-app",
        recipient: recipientEmail || targetUserId,
        subject,
        source_app: sourceApp,
        message_type: "support",
        delivery_status: "sent",
        brevo_message_id: emailResult?.messageId ?? null,
        details: relatedTicketId ? `Reply to ticket ${relatedTicketId}` : "ComsSystem reply",
      });

      return json({ success: true, messageId: emailResult?.messageId ?? null });
    }

    // ── User Message (public contact form) ──────────────────
    if (action === "user_message") {
      const { email, name, subject, message, source_app } = payload;

      if (!email || !subject || !message) {
        return json({ error: "email, subject, and message are required" }, 400);
      }

      const adminId = await findAdminUserId();
      if (!adminId) return json({ error: "No admin user found" }, 500);
      const requester = await getRequester();

      await supabase.from("inbound_messages").insert({
        user_id: adminId,
        sender_user_id: requester?.id ?? null,
        target_user_id: adminId,
        direction: "inbound",
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
