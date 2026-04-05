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
}

export interface PushNotificationOptions {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  sourceApp: string;
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
   */
  async createTicket(options: CreateTicketOptions) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error("ComsSDK: user not authenticated");

    const { data, error } = await supabase.from("support_tickets").insert({
      user_id: userId,
      subject: options.subject,
      message: options.message,
      priority: options.priority || "normal",
      source_app: options.sourceApp,
    }).select().single();

    if (error) throw new Error(`ComsSDK.createTicket failed: ${error.message}`);
    return data;
  },

  /**
   * Push an in-app notification to the current user's inbox.
   */
  async pushNotification(options: PushNotificationOptions) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error("ComsSDK: user not authenticated");

    const { error } = await supabase.from("inbound_messages").insert({
      user_id: userId,
      sender: options.sourceApp,
      sender_name: options.sourceApp,
      subject: options.title,
      body: options.message,
      channel: "in-app",
      type: "notification",
      source_app: options.sourceApp,
    });

    if (error) throw new Error(`ComsSDK.pushNotification failed: ${error.message}`);
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
};
