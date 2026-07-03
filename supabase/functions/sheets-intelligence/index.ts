// Amineva Sheets — intelligence edge function
// Uses Lovable AI Gateway (no key needed) to explain, chart-suggest,
// anomaly-detect and cleanup-suggest on a selected data range.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const prompts: Record<string, string> = {
      summarize: "You are a senior data analyst. Given these columns of tabular data, produce a concise, executive-grade narrative summary highlighting distributions, notable values, relationships and one recommended next step. Return plain prose, no markdown headers.",
      chart: "You are a data-visualisation consultant. Given these columns, recommend the single best chart type and which fields go on X, Y, series/color, and why. Reply in 3 short lines.",
      anomalies: "Identify anomalous rows across the columns provided and briefly explain why each is anomalous. If none, say so. Be terse.",
      cleanup: "Suggest concrete data cleanup actions (trim, coerce types, deduplicate, standardise). Bulleted list, at most 6 items.",
    };
    const sys = prompts[action];
    if (!sys) return json({ error: "Unknown action" }, 400);

    const user = `Columns:\n${JSON.stringify(payload?.columns ?? [], null, 2)}`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return json({ error: `Gateway ${upstream.status}: ${text}` }, upstream.status);
    }
    const data = await upstream.json();
    const result = data?.choices?.[0]?.message?.content ?? "";
    return json({ result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
