import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PROMPTS: Record<string, string> = {
  summarize: "Summarize the following document in 5-7 concise bullet points. Output only the summary.",
  rewrite: "Rewrite the following text to be clearer and more professional. Output only the rewritten text.",
  grammar: "Fix all spelling and grammar issues in the following text. Preserve meaning and tone. Output only the corrected text.",
  tone: "Improve the tone of the following text to be more polished and professional. Output only the improved text.",
  translate: "Translate the following text to English (or to French if it is already English). Output only the translation.",
  expand: "Expand the following text into a more detailed, comprehensive version. Output only the expanded text.",
  shorten: "Shorten the following text while preserving key meaning. Output only the shortened version.",
  executive_summary: "Write a 3-paragraph executive summary of the following content. Output only the summary.",
  action_items: "Extract a numbered list of clear action items from the following content. Output only the list.",
  decisions: "Extract a numbered list of decisions made in the following content. Output only the list.",
  risks: "Extract a numbered list of risks identified in the following content. Output only the list.",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { action, text } = body as { action?: string; text?: string };

    if (!action || !text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'action and text are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = PROMPTS[action] || PROMPTS.rewrite;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text.slice(0, 20000) },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${resp.status}`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const result = data?.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
