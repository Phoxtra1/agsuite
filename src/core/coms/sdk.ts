// src/core/coms/sdk.ts
// PURPOSE: Shared ComsSystem SDK — all Amineva products (AGStock, AGIS, AgroClimate, etc.)
// import { ComsSDK } from "@/core/coms/sdk" and use it to send emails, log events,
// create support tickets, and push in-app notifications centrally.

import { supabase } from "@/integrations/supabase/client";

export type ComsChannel = "email" | "in-app" | "sms";
export type MessageType = "transactional" | "marketing" | "support" | "system";

export interface SendEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  sourceApp: string;
  messageType?: MessageType;
  tags?: string[];
  sender?: { name: string; email: string };
}

export interface LogEventOptions {
  event: string;
  channel: ComsChannel;
  recipient: string;
  subject?: string;
  sourceApp: string;
  messageType?: MessageType;
  deliveryStatus?: string;
  brevoMessageId?: string;
  details?: string;
}

export interface CreateTicketOptions {
  subject: string;
  message: string;
  priority?: "low" | "normal" | "high" | "urgent";
  sourceApp: string;
  userEmail?: string;
  userName?: string;
}

export interface PushNotificationOptions {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  sourceApp: string;
  targetUserId?: string;
  recipientEmail?: string;
  recipientName?: string;
}

export interface ReceiveMessageOptions {
  fromEmail: string;
  fromName?: string;
  subject: string;
  message: string;
  sourceApp: string;
  type?: "general" | "support";
}

export interface TicketAttachmentInput {
  storage_path: string;
  file_name: string;
  mime_type?: string;
  size_bytes?: number;
}

export interface SendReplyOptions {
  subject: string;
  message: string;
  sourceApp?: string;
  recipientEmail?: string;
  recipientName?: string;
  targetUserId?: string;
  ticketId?: string;
  replyToMessageId?: string;
  attachments?: TicketAttachmentInput[];
}

/**
 * Structured error returned by every coms-inbound invocation. The `code`
 * field is stable and machine-readable so the UI can surface precise
 * diagnostics ("no_admin_mapped", "email_provider_failed", "auth_required",
 * "no_recipient_mapping", etc.).
 */
export class ComsRoutingError extends Error {
  code: string;
  status?: number;
  action: string;
  constructor(action: string, code: string, message: string, status?: number) {
    super(message);
    this.name = "ComsRoutingError";
    this.action = action;
    this.code = code;
    this.status = status;
  }
}

/**
 * Invoke `coms-inbound` and parse the structured envelope. Any non-success
 * response is converted into a `ComsRoutingError` with a stable `code` and
 * is also persisted to `coms_logs` (best-effort) so it is visible in the
 * Logs and Analytics tabs of ComsSystem.
 */
async function invokeInbound(action: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("coms-inbound", {
    body: { action, ...body },
  });

  // Network / function-level error from the SDK
  if (error) {
    const ctxAny = (error as any)?.context;
    let parsed: any = null;
    try {
      if (ctxAny && typeof ctxAny.json === "function") parsed = await ctxAny.json();
    } catch { /* ignore */ }
    const code = parsed?.code || "network_error";
    const message = parsed?.error || error.message || "Routing failed";
    await safeLogFailure(action, code, message, body);
    throw new ComsRoutingError(action, code, message);
  }

  // Application-level error in the envelope
  if (data && typeof data === "object" && (data as any).error) {
    const code = (data as any).code || "unknown_error";
    const message = (data as any).error;
    await safeLogFailure(action, code, message, body);
    throw new ComsRoutingError(action, code, message);
  }

  return data;
}

async function safeLogFailure(action: string, code: string, message: string, body: Record<string, unknown>) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return; // can't log without a user_id (RLS)
    await supabase.from("coms_logs").insert({
      user_id: userId,
      event: "failed",
      channel: "in-app",
      recipient: String(body.recipient_email || body.target_user_id || body.email || "unknown"),
      subject: String(body.subject || `coms-inbound:${action}`),
      source_app: String(body.source_app || "ComsSystem"),
      message_type: "system",
      delivery_status: "failed",
      details: `[${action}] ${code}: ${message}`,
    });
  } catch { /* swallow — logging is best-effort */ }
}

/**
 * ComsSDK — the single entry point for all cross-product communication.
 * 
 * Usage from any Amineva product:
 * ```ts
 * import { ComsSDK } from "@/core/coms/sdk";
 * 
 * // Send an email
 * await ComsSDK.sendEmail({
 *   to: [{ email: "user@example.com", name: "John" }],
 *   subject: "Order Confirmed",
 *   htmlContent: "<p>Your order has been confirmed.</p>",
 *   sourceApp: "AGStock",
 *   tags: ["order-confirmation"],
 * });
 * 
 * // Log a coms event
 * await ComsSDK.logEvent({
 *   event: "email-sent",
 *   channel: "email",
 *   recipient: "user@example.com",
 *   subject: "Order Confirmed",
 *   sourceApp: "AGStock",
 * });
 * 
 * // Create a support ticket
 * await ComsSDK.createTicket({
 *   subject: "Can't access dashboard",
 *   message: "I'm getting a 403 error...",
 *   sourceApp: "AGIS",
 *   priority: "high",
 * });
 * 
 * // Push in-app notification
 * await ComsSDK.pushNotification({
 *   title: "Low Stock Alert",
 *   message: "Tomatoes are below reorder level",
 *   type: "warning",
 *   sourceApp: "AGStock",
 * });
 * ```
 */
export const ComsSDK = {
  /**
   * Send an email through the centralized Brevo pipeline.
   * Automatically logs to coms_logs.
   */
  async sendEmail(options: SendEmailOptions) {
    const {
      to,
      subject,
      htmlContent,
      textContent,
      sourceApp,
      messageType = "transactional",
      tags = [],
      sender,
    } = options;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // 1. Send via edge function
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to,
        subject,
        htmlContent,
        textContent,
        sender: sender || { name: `Amineva ${sourceApp}`, email: "noreply@amineva.com" },
        tags: [sourceApp.toLowerCase(), ...tags],
      },
    });

    // 2. Log to coms_logs
    if (userId) {
      for (const recipient of to) {
        await supabase.from("coms_logs").insert({
          user_id: userId,
          event: error ? "failed" : "delivered",
          channel: "email",
          recipient: recipient.email,
          subject,
          source_app: sourceApp,
          message_type: messageType,
          delivery_status: error ? "failed" : "sent",
          brevo_message_id: data?.messageId || null,
          details: error ? String(error) : null,
        });
      }
    }

    if (error) throw new Error(`ComsSDK.sendEmail failed: ${error.message}`);
    return data;
  },

  /**
   * Log a communication event to coms_logs without sending anything.
   */
  async logEvent(options: LogEventOptions) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error("ComsSDK: user not authenticated");

    const { error } = await supabase.from("coms_logs").insert({
      user_id: userId,
      event: options.event,
      channel: options.channel,
      recipient: options.recipient,
      subject: options.subject || null,
      source_app: options.sourceApp,
      message_type: options.messageType || "transactional",
      delivery_status: options.deliveryStatus || "sent",
      brevo_message_id: options.brevoMessageId || null,
      details: options.details || null,
    });

    if (error) throw new Error(`ComsSDK.logEvent failed: ${error.message}`);
  },

  /**
   * Create a support ticket routed through ComsSystem.
   * Throws ComsRoutingError on failure with a stable `code` for diagnostics.
   */
  async createTicket(options: CreateTicketOptions) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    return invokeInbound("support_ticket", {
      email: options.userEmail || user?.email,
      name: options.userName || user?.user_metadata?.name || user?.email,
      subject: options.subject,
      message: options.message,
      priority: options.priority || "normal",
      source_app: options.sourceApp,
    });
  },

  /**
   * Push an in-app notification to the current user's inbox.
   */
  async pushNotification(options: PushNotificationOptions) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const targetUserId = options.targetUserId || userId;
    if (!targetUserId) throw new ComsRoutingError("pushNotification", "no_recipient_mapping", "ComsSDK: target user not available");

    const { error } = await (supabase.from as any)("inbound_messages").insert({
      user_id: targetUserId,
      sender_user_id: userId ?? null,
      target_user_id: targetUserId,
      direction: "inbound",
      sender: options.sourceApp,
      sender_name: options.sourceApp,
      subject: options.title,
      body: options.message,
      channel: "in-app",
      type: "notification",
      source_app: options.sourceApp,
    });

    if (error) {
      await safeLogFailure("pushNotification", "inbox_insert_failed", error.message, { source_app: options.sourceApp, subject: options.title });
      throw new ComsRoutingError("pushNotification", "inbox_insert_failed", error.message);
    }
  },

  /**
   * Route a user/team message into the central ComsSystem inbox.
   */
  async receiveMessage(options: ReceiveMessageOptions) {
    return invokeInbound(options.type === "support" ? "support_ticket" : "user_message", {
      email: options.fromEmail,
      name: options.fromName,
      subject: options.subject,
      message: options.message,
      source_app: options.sourceApp,
      priority: "normal",
    });
  },

  /**
   * Send a ComsSystem reply to an external email or a signed-in team member.
   * On success, the related ticket (if any) is automatically transitioned to
   * `replied` with `last_replied_at` updated server-side.
   */
  async sendReply(options: SendReplyOptions) {
    return invokeInbound("reply", {
      recipient_email: options.recipientEmail,
      recipient_name: options.recipientName,
      target_user_id: options.targetUserId,
      subject: options.subject,
      message: options.message,
      source_app: options.sourceApp || "ComsSystem",
      ticket_id: options.ticketId,
      reply_to_message_id: options.replyToMessageId,
    });
  },

  /**
   * Transition a ticket lifecycle (open → replied → resolved → closed).
   * Goes through coms-inbound so updates are audited in coms_logs.
   */
  async updateTicketStatus(ticketId: string, status: "open" | "replied" | "resolved" | "closed") {
    return invokeInbound("update_ticket_status", { ticket_id: ticketId, status });
  },


  /**
   * Fetch communication logs for the current user, optionally filtered.
   */
  async getLogs(filters?: { sourceApp?: string; channel?: string; limit?: number }) {
    let query = supabase
      .from("coms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters?.limit || 100);

    if (filters?.sourceApp) query = query.eq("source_app", filters.sourceApp);
    if (filters?.channel) query = query.eq("channel", filters.channel);

    const { data, error } = await query;
    if (error) throw new Error(`ComsSDK.getLogs failed: ${error.message}`);
    return data;
  },

  /**
   * Subscribe to real-time coms_logs updates.
   * Returns unsubscribe function.
   */
  subscribeToLogs(callback: (payload: any) => void) {
    const channel = supabase
      .channel("coms-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "coms_logs" },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to real-time inbound message updates.
   * Returns unsubscribe function.
   */
  subscribeToInbox(callback: (payload: any) => void) {
    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbound_messages" },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to real-time support_tickets updates so any reply, status
   * change or new ticket reflects everywhere instantly.
   */
  subscribeToTickets(callback: (payload: any) => void) {
    const channel = supabase
      .channel("tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
