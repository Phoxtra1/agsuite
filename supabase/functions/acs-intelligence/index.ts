// supabase/functions/acs-intelligence/index.ts
// PURPOSE: AI Processing Engine — predictive analytics, anomaly detection, pattern recognition
// Uses Lovable AI Gateway to analyze raw data and produce actionable intelligence

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-acs-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const INTELLIGENCE_CATEGORIES = [
  "financial",
  "market_commodity",
  "agro_climate",
  "predictive_alert",
  "anomaly",
  "operational",
  "pattern",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── Auth: JWT or API key ──────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const apiKey = req.headers.get("x-acs-api-key");
  const expectedKey = Deno.env.get("ACS_INGEST_API_KEY");

  let userId: string | null = null;
  let isAuthed = false;

  if (apiKey && expectedKey && apiKey === expectedKey) {
    isAuthed = true;
  } else if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    // Skip if it's the anon key itself
    if (token !== anonKey) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        anonKey,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data, error } = await userClient.auth.getClaims(token);
      if (!error && data?.claims?.sub) {
        userId = data.claims.sub as string;
        isAuthed = true;
      }
    }
  }

  // ── GET: Public query endpoints ───────────────────────────
  if (req.method === "GET") {
    const url = new URL(req.url);
    const endpoint = url.pathname.split("/").pop();

    // Health
    if (endpoint === "acs-intelligence" || !endpoint) {
      return json({
        status: "online",
        service: "acs-intelligence",
        version: "1.0",
        categories: INTELLIGENCE_CATEGORIES,
        timestamp: new Date().toISOString(),
      });
    }
    return json({ error: "Unknown endpoint" }, 404);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action as string | undefined;

  // ── Public read actions (no auth needed) ──────────────────
  if (action === "query") {
    const { category, limit, offset, platform } = body as {
      category?: string;
      limit?: number;
      offset?: number;
      platform?: string;
    };

    let query = supabase
      .from("acs_intelligence_outputs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);
    if (platform) query = query.contains("source_platforms", [platform]);
    if (limit) {
      const off = offset ?? 0;
      query = query.range(off, off + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) return json({ error: error.message }, 500);
    return json({ data, count: count ?? 0 });
  }

  if (action === "alerts") {
    const { data, error } = await supabase
      .from("acs_intelligence_outputs")
      .select("*")
      .eq("category", "predictive_alert")
      .gte("valid_until", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return json({ error: error.message }, 500);
    return json({ alerts: data ?? [] });
  }

  if (action === "summary") {
    // Return counts by category
    const cats = [...INTELLIGENCE_CATEGORIES];
    const results: Record<string, number> = {};
    for (const cat of cats) {
      const { count } = await supabase
        .from("acs_intelligence_outputs")
        .select("*", { count: "exact", head: true })
        .eq("category", cat);
      results[cat] = count ?? 0;
    }

    const { count: totalRaw } = await supabase
      .from("acs_raw_data")
      .select("*", { count: "exact", head: true });

    const { count: totalProcessed } = await supabase
      .from("acs_processing_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    return json({
      intelligence_by_category: results,
      total_raw_records: totalRaw ?? 0,
      total_processed_pipelines: totalProcessed ?? 0,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Auth-required actions ─────────────────────────────────
  if (!isAuthed) {
    return json({ error: "Unauthorized" }, 401);
  }

  // ── AI Analyze: Process raw data with AI ──────────────────
  if (action === "analyze") {
    const { platform, dataset_type, category, limit: rawLimit } = body as {
      platform?: string;
      dataset_type?: string;
      category?: string;
      limit?: number;
    };

    const targetCategory = category ?? "operational";
    const fetchLimit = Math.min(rawLimit ?? 50, 100);

    // Fetch raw data to analyze
    let rawQuery = supabase
      .from("acs_raw_data")
      .select("*")
      .order("ingested_at", { ascending: false })
      .limit(fetchLimit);

    if (platform) rawQuery = rawQuery.eq("platform", platform);
    if (dataset_type) rawQuery = rawQuery.eq("dataset_type", dataset_type);

    const { data: rawData, error: rawError } = await rawQuery;
    if (rawError) return json({ error: rawError.message }, 500);
    if (!rawData || rawData.length === 0) {
      return json({ error: "No raw data available for analysis" }, 404);
    }

    // Start pipeline log
    const { data: pipelineLog } = await supabase
      .from("acs_processing_logs")
      .insert([{
        pipeline: `ai_${targetCategory}`,
        status: "running",
        input_count: rawData.length,
        metadata: { platform, dataset_type, category: targetCategory },
      }])
      .select()
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Complete pipeline with error
      if (pipelineLog) {
        await supabase
          .from("acs_processing_logs")
          .update({ status: "failed", completed_at: new Date().toISOString(), error_message: "LOVABLE_API_KEY not configured" })
          .eq("id", pipelineLog.id);
      }
      return json({ error: "AI processing not available — API key not configured" }, 503);
    }

    // Summarize raw data for AI prompt
    const dataSummary = rawData.slice(0, 20).map((r: any) => ({
      platform: r.platform,
      type: r.dataset_type,
      payload: r.raw_payload,
      ingested: r.ingested_at,
    }));

    const systemPrompt = `You are ACS Intelligence Engine for Amineva — an enterprise platform serving financial networks (mobile money, microcredit, forex bureaus, insurance) and agricultural systems across Africa.

Analyze the provided raw data and produce actionable intelligence. Focus on:
1. PATTERNS: Recurring trends, correlations, seasonal variations
2. ANOMALIES: Unusual data points, outliers, potential risks  
3. PREDICTIONS: Forward-looking insights based on the data
4. RECOMMENDATIONS: Actionable steps based on your analysis

Category: ${targetCategory}
Platform filter: ${platform ?? "all"}

Return a JSON object with this exact structure:
{
  "title": "Brief title of the intelligence finding",
  "summary": "2-3 sentence executive summary",
  "patterns": [{"description": "...", "confidence": 0.0-1.0}],
  "anomalies": [{"description": "...", "severity": "low|medium|high", "data_point": "..."}],
  "predictions": [{"description": "...", "timeframe": "...", "confidence": 0.0-1.0}],
  "recommendations": [{"action": "...", "priority": "low|medium|high|critical", "rationale": "..."}],
  "overall_confidence": 0.0-1.0
}`;

    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this data:\n${JSON.stringify(dataSummary, null, 2)}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "produce_intelligence",
              description: "Output structured intelligence analysis",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["description", "confidence"],
                    },
                  },
                  anomalies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        data_point: { type: "string" },
                      },
                      required: ["description", "severity"],
                    },
                  },
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        timeframe: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["description", "timeframe", "confidence"],
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        rationale: { type: "string" },
                      },
                      required: ["action", "priority"],
                    },
                  },
                  overall_confidence: { type: "number" },
                },
                required: ["title", "summary", "overall_confidence"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "produce_intelligence" } },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI gateway error:", aiResponse.status, errText);
        if (pipelineLog) {
          await supabase
            .from("acs_processing_logs")
            .update({ status: "failed", completed_at: new Date().toISOString(), error_message: `AI error: ${aiResponse.status}` })
            .eq("id", pipelineLog.id);
        }
        if (aiResponse.status === 429) {
          return json({ error: "AI rate limit exceeded. Please try again later." }, 429);
        }
        if (aiResponse.status === 402) {
          return json({ error: "AI credits exhausted. Please add funds." }, 402);
        }
        return json({ error: "AI processing failed" }, 500);
      }

      const aiResult = await aiResponse.json();
      let intelligence: Record<string, unknown> = {};

      // Extract from tool call
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          intelligence = JSON.parse(toolCall.function.arguments);
        } catch {
          intelligence = { raw_response: toolCall.function.arguments };
        }
      } else {
        // Fallback to content
        const content = aiResult.choices?.[0]?.message?.content ?? "";
        try {
          intelligence = JSON.parse(content);
        } catch {
          intelligence = { raw_response: content };
        }
      }

      // Store intelligence output
      const sourcePlatforms = platform ? [platform] : [...new Set(rawData.map((r: any) => r.platform))];
      const { data: intOutput, error: intError } = await supabase
        .from("acs_intelligence_outputs")
        .insert([{
          category: targetCategory,
          title: (intelligence.title as string) ?? `${targetCategory} analysis`,
          summary: (intelligence.summary as string) ?? null,
          intelligence,
          confidence: (intelligence.overall_confidence as number) ?? null,
          source_pipeline: pipelineLog?.id ?? null,
          source_platforms: sourcePlatforms,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();

      if (intError) {
        console.error("Failed to store intelligence:", intError);
      }

      // Log transformation audit
      await supabase.from("acs_transformation_audit").insert([{
        processing_log_id: pipelineLog?.id ?? null,
        transform_type: "enrich",
        input_snapshot: { record_count: rawData.length, platforms: sourcePlatforms },
        output_snapshot: intelligence,
        changes_summary: `AI analysis produced ${targetCategory} intelligence from ${rawData.length} raw records`,
      }]);

      // Complete pipeline
      if (pipelineLog) {
        await supabase
          .from("acs_processing_logs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            output_count: 1,
          })
          .eq("id", pipelineLog.id);
      }

      // Log event
      await supabase.from("acs_events").insert([{
        source: "acs-intelligence",
        type: `ai_analysis:${targetCategory}`,
        payload: { intelligence_id: intOutput?.id, platform, records_analyzed: rawData.length },
      }]);

      return json({
        success: true,
        intelligence: intOutput ?? intelligence,
        pipeline_id: pipelineLog?.id,
        records_analyzed: rawData.length,
      });

    } catch (err: any) {
      console.error("AI analysis error:", err);
      if (pipelineLog) {
        await supabase
          .from("acs_processing_logs")
          .update({ status: "failed", completed_at: new Date().toISOString(), error_message: err.message })
          .eq("id", pipelineLog.id);
      }
      return json({ error: "AI analysis failed: " + (err.message ?? "Unknown error") }, 500);
    }
  }

  // ── Detect Anomalies ──────────────────────────────────────
  if (action === "detect_anomalies") {
    const { platform, timeframe_hours } = body as {
      platform?: string;
      timeframe_hours?: number;
    };

    const hours = timeframe_hours ?? 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from("acs_raw_data")
      .select("*")
      .gte("ingested_at", since)
      .order("ingested_at", { ascending: false })
      .limit(100);

    if (platform) query = query.eq("platform", platform);

    const { data: rawData, error } = await query;
    if (error) return json({ error: error.message }, 500);
    if (!rawData || rawData.length === 0) {
      return json({ anomalies: [], message: "No data in timeframe" });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "AI not configured" }, 503);
    }

    const dataForAI = rawData.slice(0, 30).map((r: any) => ({
      platform: r.platform,
      type: r.dataset_type,
      payload: r.raw_payload,
      time: r.ingested_at,
    }));

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an anomaly detection engine for Amineva's data infrastructure. Analyze the data and identify anomalies, outliers, and unusual patterns. Return JSON: {"anomalies": [{"description": "...", "severity": "low|medium|high|critical", "affected_platform": "...", "data_point": "...", "recommended_action": "..."}], "risk_score": 0-100}`,
            },
            { role: "user", content: JSON.stringify(dataForAI) },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_anomalies",
              description: "Report detected anomalies",
              parameters: {
                type: "object",
                properties: {
                  anomalies: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        affected_platform: { type: "string" },
                        data_point: { type: "string" },
                        recommended_action: { type: "string" },
                      },
                      required: ["description", "severity"],
                    },
                  },
                  risk_score: { type: "number" },
                },
                required: ["anomalies", "risk_score"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_anomalies" } },
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.error("Anomaly AI error:", resp.status, t);
        if (resp.status === 429) return json({ error: "Rate limited" }, 429);
        if (resp.status === 402) return json({ error: "Credits exhausted" }, 402);
        return json({ error: "Anomaly detection failed" }, 500);
      }

      const result = await resp.json();
      let anomalyData: Record<string, unknown> = {};
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (tc?.function?.arguments) {
        try { anomalyData = JSON.parse(tc.function.arguments); } catch { anomalyData = {}; }
      }

      const anomalies = (anomalyData.anomalies as any[]) ?? [];
      const riskScore = (anomalyData.risk_score as number) ?? 0;

      // Store high-severity anomalies as alerts
      if (anomalies.some((a: any) => a.severity === "high" || a.severity === "critical")) {
        await supabase.from("acs_intelligence_outputs").insert([{
          category: "predictive_alert",
          title: `Anomaly Alert: ${platform ?? "multi-platform"}`,
          summary: `${anomalies.length} anomalies detected, risk score: ${riskScore}/100`,
          intelligence: anomalyData,
          confidence: riskScore / 100,
          source_pipeline: "anomaly_detection",
          source_platforms: platform ? [platform] : [...new Set(rawData.map((r: any) => r.platform))],
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        }]);
      }

      return json({ anomalies, risk_score: riskScore, records_scanned: rawData.length });

    } catch (err: any) {
      console.error("Anomaly detection error:", err);
      return json({ error: err.message }, 500);
    }
  }

  // ── Generate Report ───────────────────────────────────────
  if (action === "report") {
    const { category, platform: reportPlatform } = body as {
      category?: string;
      platform?: string;
    };

    // Fetch recent intelligence
    let intQuery = supabase
      .from("acs_intelligence_outputs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (category) intQuery = intQuery.eq("category", category);
    if (reportPlatform) intQuery = intQuery.contains("source_platforms", [reportPlatform]);

    const { data: intData } = await intQuery;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 503);

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are ACS Report Generator for Amineva. Generate a comprehensive intelligence report from the provided data. Format as structured markdown with sections: Executive Summary, Key Findings, Risk Assessment, Recommendations, and Outlook. Be specific and actionable.`,
            },
            { role: "user", content: `Generate an intelligence report from this data:\n${JSON.stringify(intData, null, 2)}` },
          ],
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        if (resp.status === 429) return json({ error: "Rate limited" }, 429);
        if (resp.status === 402) return json({ error: "Credits exhausted" }, 402);
        return json({ error: "Report generation failed" }, 500);
      }

      const result = await resp.json();
      const report = result.choices?.[0]?.message?.content ?? "Report generation failed";

      return json({ report, generated_at: new Date().toISOString(), source_records: intData?.length ?? 0 });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  return json({ error: `Unknown action: ${action ?? "(none)"}` }, 400);
});
