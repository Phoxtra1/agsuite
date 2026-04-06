// src/core/coms/hooks/support.ts
// Support ticket hooks — route all support interactions through ComsSDK
// Handles both authenticated and unauthenticated (public form) submissions.

import { ComsSDK } from "@/core/coms/sdk";
import { supabase } from "@/integrations/supabase/client";

const SOURCE = "ComsSystem";

export const SupportComs = {
  /**
   * Submit a support ticket and push it into ComsSystem inbox + coms_logs.
   * Works from any product — just pass sourceApp.
   * Handles unauthenticated users (public support form) via edge function.
   */
  async submitTicket(opts: {
    subject: string;
    message: string;
    priority?: "low" | "normal" | "high" | "urgent";
    sourceApp?: string;
    userEmail?: string;
    userName?: string;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userId) {
      // Authenticated path — direct DB writes
      const ticket = await ComsSDK.createTicket({
        subject: opts.subject,
        message: opts.message,
        priority: opts.priority || "normal",
        sourceApp: opts.sourceApp || SOURCE,
      });

      await ComsSDK.pushNotification({
        title: `Support: ${opts.subject}`,
        message: opts.message.slice(0, 200),
        type: "info",
        sourceApp: opts.sourceApp || SOURCE,
      });

      await ComsSDK.logEvent({
        event: "ticket-created",
        channel: "in-app",
        recipient: opts.userEmail || "self",
        subject: opts.subject,
        sourceApp: opts.sourceApp || SOURCE,
        messageType: "support",
        deliveryStatus: "sent",
      });

      return ticket;
    }

    // Unauthenticated path — route through edge function
    const { data, error } = await supabase.functions.invoke("coms-inbound", {
      body: {
        action: "support_ticket",
        email: opts.userEmail,
        name: opts.userName,
        subject: opts.subject,
        message: opts.message,
        priority: opts.priority || "normal",
        source_app: opts.sourceApp || SOURCE,
      },
    });

    if (error) throw new Error(`Support submission failed: ${error.message}`);
    return data;
  },

  /**
   * Reply to a support ticket — sends email to the ticket creator
   * and logs the reply in ComsSystem.
   */
  async replyToTicket(opts: {
    ticketId: string;
    replyBody: string;
    recipientEmail: string;
    recipientName?: string;
    sourceApp?: string;
  }) {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", opts.ticketId)
      .single();

    if (!ticket) throw new Error("Ticket not found");

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#6366f1">Support Reply</h2>
        <p>Hi ${opts.recipientName || "there"},</p>
        <p>We've responded to your ticket: <strong>${ticket.subject}</strong></p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #6366f1">
          ${opts.replyBody}
        </div>
        <p style="color:#64748b;font-size:12px">Amineva Support Team</p>
      </div>`;

    await ComsSDK.sendEmail({
      to: [{ email: opts.recipientEmail, name: opts.recipientName }],
      subject: `Re: ${ticket.subject}`,
      htmlContent: html,
      sourceApp: opts.sourceApp || SOURCE,
      messageType: "support",
      tags: ["support-reply", `ticket-${opts.ticketId.slice(0, 8)}`],
    });

    await supabase
      .from("support_tickets")
      .update({ status: "replied" })
      .eq("id", opts.ticketId);
  },

  /**
   * Send a general user message through ComsSystem.
   * This is for any message a user sends from any product contact form.
   */
  async sendUserMessage(opts: {
    fromEmail: string;
    fromName?: string;
    subject: string;
    message: string;
    sourceApp?: string;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userId) {
      await supabase.from("inbound_messages").insert({
        user_id: userId,
        sender: opts.fromEmail,
        sender_name: opts.fromName || opts.fromEmail,
        subject: opts.subject,
        body: opts.message,
        channel: "email",
        type: "support",
        source_app: opts.sourceApp || "external",
      });

      await ComsSDK.logEvent({
        event: "user-message-received",
        channel: "email",
        recipient: opts.fromEmail,
        subject: opts.subject,
        sourceApp: opts.sourceApp || "external",
        messageType: "support",
        deliveryStatus: "received",
      });
    } else {
      // Unauthenticated — route through edge function
      await supabase.functions.invoke("coms-inbound", {
        body: {
          action: "user_message",
          email: opts.fromEmail,
          name: opts.fromName,
          subject: opts.subject,
          message: opts.message,
          source_app: opts.sourceApp || "external",
        },
      });
    }
  },
};
