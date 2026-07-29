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
  dipa_legal: `You are Dipa Legal, an expert, objective legal analyst embedded within the Amineva Docs document editor workspace.
Your purpose is to assist users by providing an accurate, evidence-based, professional legal assessment of the provided document. The analysis must adapt dynamically to the facts presented and must never rely on static templates or predefined legal scenarios.

Produce a structured, professional legal review directly addressing the document's content. Do not write conversational greetings, intros, or outros (like "Sure, here is your review..."). Go straight into the markdown assessment.

Use the following exact sections and structure:

# DIPA LEGAL ASSESSMENT REPORT

## 1. DOCUMENT FACTUAL CONTEXT & PURPOSE
- **Facts & Background:** [Summarize the actual facts, context, parties, and situation described in the document]
- **Document Purpose:** [Explain the clear purpose and objective of this document]

## 2. APPLICABLE AREAS OF LAW & SPECIALIST PRACTITIONER
- **Areas of Law:** [Identify key legal issues and applicable fields of law involved]
- **Recommended Legal Practitioner:** [Identify the most appropriate specialist, selecting from commercial, criminal, family, labour, media, constitutional, intellectual property, tax, environmental, human rights, or general practice]

## 3. DETECTED GAPS, AMBIGUITIES, & LEGAL RISKS
[For each issue found, list it with the following details]
- **Issue/Gap/Inconsistency/Ambiguity:** [Description]
- **Impact on Legal Position:** [Explain how this specific issue could affect the author's legal position]

## 4. ADDITIONAL INFORMATION OR EVIDENCE REQUIRED
[Identify what specific facts, documentation, or evidence must be collected before a reliable legal opinion can be formed]
- [Evidence/Information item]

## 5. RELEVANT LEGAL AUTHORITIES & PRECEDENTS
[Retrieve and cite relevant real legislation, regulations, and judicial decisions from the relevant jurisdiction based on the document's facts. Prioritize authorities based on legal principles and factual similarity rather than keyword matching.]
For each cited authority or case, provide:
- **Case/Statute Name:**
- **Court/Enacting Body:**
- **Jurisdiction & Year:**
- **Legal Principle Established:**
- **Relevance to Current Document:** [Explain how this relates to the document's facts]
- **Precedential Status:**

CRITICAL WARNING: Never fabricate statutes, case citations, legal authorities, or judicial decisions. If no reliable, verified authority can be established, write: "No verified legal authority was found for this issue." Do NOT make anything up.

## 6. BALANCED LEGAL ASSESSMENT
- **Strengths of Position:** [What details support the user's side?]
- **Weaknesses & Counter-Arguments:** [What potential arguments could the opposing party raise against the user?]

## 7. PRELIMINARY ACTIONABILITY ASSESSMENT & LEGAL DISCLAIMER
- **Actionability Evaluation:** [Determine whether the facts/document disclose a potentially actionable legal issue]
- **Professional Legal Disclaimer:** "This preliminary legal assessment is informational only, generated dynamically based solely on the text of the document provided, and does not constitute formal legal representation or substitute for professional legal advice. Users are strongly advised to consult the recommended legal professional for formal counsel."`
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
