// src/core/coms/hooks/support.ts
// Support ticket hooks — ALL submissions route through coms-inbound edge function
// so they land in the admin's ComsSystem inbox (not the sender's).

import { ComsSDK } from "@/core/coms/sdk";
import { supabase } from "@/integrations/supabase/client";

const SOURCE = "ComsSystem";

export const SupportComs = {
  /**
   * Submit a support ticket.
   * ALWAYS routes through the coms-inbound edge function (service_role)
   * so the message lands in the admin's inbox regardless of auth state.
   */
  async submitTicket(opts: {
    subject: string;
    message: string;
    priority?: "low" | "normal" | "high" | "urgent";
    sourceApp?: string;
    userEmail?: string;
    userName?: string;
  }) {
    // Resolve sender info from auth if available
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    const email = opts.userEmail || user?.email || "unknown@unknown.com";
    const name = opts.userName || user?.user_metadata?.name || email;

    const { data, error } = await supabase.functions.invoke("coms-inbound", {
      body: {
        action: "support_ticket",
        email,
        name,
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
    targetUserId?: string;
    sourceApp?: string;
    attachments?: import("@/core/coms/sdk").TicketAttachmentInput[];
  }) {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", opts.ticketId)
      .single();

    if (!ticket) throw new Error("Ticket not found");

    await ComsSDK.sendReply({
      recipientEmail: opts.recipientEmail,
      recipientName: opts.recipientName,
      targetUserId: opts.targetUserId,
      subject: `Re: ${ticket.subject}`,
      message: opts.replyBody,
      sourceApp: opts.sourceApp || SOURCE,
      ticketId: opts.ticketId,
      attachments: opts.attachments,
    });
  },

  /**
   * Send a general user message through ComsSystem.
   * Always routes through edge function so it reaches admin inbox.
   */
  async sendUserMessage(opts: {
    fromEmail: string;
    fromName?: string;
    subject: string;
    message: string;
    sourceApp?: string;
  }) {
    const { data, error } = await supabase.functions.invoke("coms-inbound", {
      body: {
        action: "user_message",
        email: opts.fromEmail,
        name: opts.fromName,
        subject: opts.subject,
        message: opts.message,
        source_app: opts.sourceApp || "external",
      },
    });

    if (error) throw new Error(`Message submission failed: ${error.message}`);
    return data;
  },
};
