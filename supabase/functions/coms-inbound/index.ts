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

// Structured error helper — every failure has a stable `code` so the client
// can surface precise diagnostics ("no_admin_mapped", "email_provider_failed", etc.)
function err(code: string, message: string, status = 400, extra: Record<string, unknown> = {}) {
  return json({ error: message, code, ...extra }, status);
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

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return err("invalid_payload", "Request body must be valid JSON", 400);
    }
    const action = (payload as any).action as string | undefined;

    async function getRequester() {
      const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return null;
      const { data } = await supabase.auth.getUser(token);
      return data.user ?? null;
    }

    async function sendBrevoEmail(opts: { to: { email: string; name?: string }[]; subject: string; htmlContent: string; tags?: string[] }) {
      const apiKey = Deno.env.get("BREVO_API_KEY");
      if (!apiKey) {
        const e: any = new Error("Email provider not configured (BREVO_API_KEY missing)");
        e.code = "email_provider_unconfigured";
        throw e;
      }
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
      if (!response.ok) {
        const e: any = new Error(`Email delivery failed: ${JSON.stringify(data)}`);
        e.code = "email_provider_failed";
        throw e;
      }
      return data as { messageId?: string };
    }

    // Pick a routing inbox owner (first profile in the system) so public messages
    // always land somewhere visible. Returns null if no profile exists yet.
    async function findAdminUserId(): Promise<string | null> {
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
      const { email, name, subject, message, priority, source_app } = payload as any;

      if (!email || !subject || !message) {
        return err("missing_fields", "email, subject, and message are required", 400);
      }

      const adminId = await findAdminUserId();
      if (!adminId) {
        return err(
          "no_admin_mapped",
          "No admin profile is configured to receive tickets. An admin must sign in at least once before tickets can be routed.",
          500
        );
      }
      const requester = await getRequester();

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
      if (ticketError) return err("ticket_insert_failed", ticketError.message, 500);

      const { error: inboxError } = await supabase.from("inbound_messages").insert({
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
      if (inboxError) return err("inbox_insert_failed", inboxError.message, 500);

      await supabase.from("coms_logs").insert({
        user_id: adminId,
        event: "ticket-created",
        channel: "email",
        recipient: email,
        subject,
        source_app: source_app || "ComsSystem",
        message_type: "support",
        delivery_status: "received",
        details: `Ticket ${ticket?.id} from ${name || email}`,
      });

      return json({ success: true, ticket_id: ticket?.id, message: "Ticket submitted" });
    }

    // ── Central reply ──────
    if (action === "reply") {
      const requester = await getRequester();
      if (!requester) return err("auth_required", "Authentication required to send replies", 401);

      const recipientEmail = cleanText((payload as any).recipient_email);
      const recipientName = cleanText((payload as any).recipient_name, recipientEmail || "Recipient");
      const targetUserId = cleanText((payload as any).target_user_id);
      const subject = cleanText((payload as any).subject);
      const message = cleanText((payload as any).message);
      const sourceApp = cleanText((payload as any).source_app, "ComsSystem");
      const relatedTicketId = cleanText((payload as any).ticket_id);
      const replyToMessageId = cleanText((payload as any).reply_to_message_id);

      if (!subject || !message) {
        return err("missing_fields", "subject and message are required", 400);
      }
      if (!recipientEmail && !targetUserId) {
        return err(
          "no_recipient_mapping",
          "No recipient could be resolved. Provide either a recipient email or a target user id.",
          400
        );
      }

      let emailResult: { messageId?: string } | null = null;
      if (recipientEmail) {
        try {
          emailResult = await sendBrevoEmail({
            to: [{ email: recipientEmail, name: recipientName }],
            subject,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;line-height:1.6"><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"><p style="color:#64748b;font-size:12px">Amineva Support Team</p></div>`,
            tags: ["coms-reply", sourceApp.toLowerCase()],
          });
        } catch (e: any) {
          // Log the failure so it shows up in the analytics + logs panel
          await supabase.from("coms_logs").insert({
            user_id: requester.id,
            event: "failed",
            channel: "email",
            recipient: recipientEmail,
            subject,
            source_app: sourceApp,
            message_type: "support",
            delivery_status: "failed",
            details: e?.message || "Unknown email failure",
          });
          return err(e?.code || "email_provider_failed", e?.message || "Email delivery failed", 502);
        }
      }

      const { error: outboundError } = await supabase.from("inbound_messages").insert({
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
      if (outboundError) return err("outbound_insert_failed", outboundError.message, 500);

      // Bump the related ticket's lifecycle: set status -> replied (unless already
      // resolved/closed), update last_replied_at + updated_at so every UI shows
      // accurate "last activity" timestamps.
      if (relatedTicketId) {
        const { data: existing } = await supabase
          .from("support_tickets")
          .select("status")
          .eq("id", relatedTicketId)
          .maybeSingle();
        const nowIso = new Date().toISOString();
        const nextStatus = existing && (existing.status === "resolved" || existing.status === "closed")
          ? existing.status
          : "replied";
        await supabase.from("support_tickets")
          .update({ status: nextStatus, last_replied_at: nowIso, updated_at: nowIso })
          .eq("id", relatedTicketId);
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

      return json({ success: true, messageId: emailResult?.messageId ?? null, ticket_id: relatedTicketId || null });
    }

    // ── Ticket status update (resolve/close/reopen) ──────
    if (action === "update_ticket_status") {
      const requester = await getRequester();
      if (!requester) return err("auth_required", "Authentication required", 401);

      const ticketId = cleanText((payload as any).ticket_id);
      const status = cleanText((payload as any).status);
      const allowed = ["open", "replied", "resolved", "closed"];
      if (!ticketId) return err("missing_fields", "ticket_id is required", 400);
      if (!allowed.includes(status)) return err("invalid_status", `status must be one of ${allowed.join(", ")}`, 400);

      const nowIso = new Date().toISOString();
      const { error } = await supabase.from("support_tickets")
        .update({ status, updated_at: nowIso })
        .eq("id", ticketId);
      if (error) return err("ticket_update_failed", error.message, 500);

      await supabase.from("coms_logs").insert({
        user_id: requester.id,
        event: `ticket-${status}`,
        channel: "in-app",
        recipient: ticketId,
        subject: `Ticket ${status}`,
        source_app: "ComsSystem",
        message_type: "support",
        delivery_status: "sent",
        details: `Ticket ${ticketId} marked ${status}`,
      });

      return json({ success: true, ticket_id: ticketId, status });
    }

    // ── User Message (public contact form) ──────────────────
    if (action === "user_message") {
      const { email, name, subject, message, source_app } = payload as any;

      if (!email || !subject || !message) {
        return err("missing_fields", "email, subject, and message are required", 400);
      }

      const adminId = await findAdminUserId();
      if (!adminId) return err("no_admin_mapped", "No admin profile available to receive messages", 500);
      const requester = await getRequester();

      const { error: inboxError } = await supabase.from("inbound_messages").insert({
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
      if (inboxError) return err("inbox_insert_failed", inboxError.message, 500);

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
    } = payload as any;

    if (!sender?.email || !subject) {
      return err("missing_fields", "sender.email and subject are required", 400);
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
      targetUserId = await findAdminUserId();
    }

    if (!targetUserId) {
      return err("no_admin_mapped", "No user available to route inbound message", 500);
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
    const code = (error as any)?.code || "unhandled_exception";
    return err(code, msg, 500);
  }
});
