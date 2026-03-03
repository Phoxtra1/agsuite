import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  sender?: { name: string; email: string };
  replyTo?: { email: string };
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const payload: EmailPayload = await req.json();

    if (!payload.to || payload.to.length === 0) {
      throw new Error('At least one recipient is required');
    }
    if (!payload.subject) {
      throw new Error('Subject is required');
    }

    const brevoPayload = {
      sender: payload.sender || { name: "Amineva Suite", email: "noreply@amineva.com" },
      to: payload.to,
      subject: payload.subject,
      htmlContent: payload.htmlContent || `<p>${payload.textContent || ''}</p>`,
      textContent: payload.textContent,
      replyTo: payload.replyTo,
      tags: payload.tags || ["amineva-suite"],
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', data);
      throw new Error(`Brevo API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, messageId: data.messageId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('send-email error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
