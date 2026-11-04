import React, { useState } from "react";
import { Sparkles, BookOpen, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { askAboutTopic, type TopicSummaryResult } from "@/lib/infoDiscovery/askTopic";

interface AskTopicPanelProps {
  topicTitle: string;
  categoryTitle: string;
  description: string;
  questions?: string[];
  referenceSources?: { name: string; url: string; scope: string }[];
}

export function AskTopicPanel({
  topicTitle,
  categoryTitle,
  description,
  questions = [],
  referenceSources = [],
}: AskTopicPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TopicSummaryResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setExpanded(true);
    try {
      const res = await askAboutTopic({
        topicTitle,
        categoryTitle,
        description,
        questions,
        referenceSources,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Ask about this topic</span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Dipa Supported
          </Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Synthesize a concise, source-backed summary for this subject with Dipa AI analysis behind the scenes.
        </p>

        {!expanded && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAsk}
            disabled={loading}
            className="mt-3 w-full border-primary/30 text-xs font-semibold hover:bg-primary/10"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5 text-accent" />
                Generate Dipa Summary
              </>
            )}
          </Button>
        )}

        {expanded && result && (
          <div className="mt-3 space-y-3 pt-3 border-t border-primary/15">
            <p className="text-xs leading-5 text-foreground">{result.summary}</p>

            {result.keyTakeaways.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-foreground mb-1.5">Key Investigation Takeaways:</p>
                <ul className="space-y-1">
                  {result.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-accent shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.sources.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Referenced Authorities:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.sources.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] text-primary hover:underline"
                    >
                      <BookOpen className="h-2.5 w-2.5" />
                      {s.name}
                      <ExternalLink className="h-2 w-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 text-[11px] text-muted-foreground hover:text-foreground text-left underline"
        >
          Hide summary
        </button>
      )}
    </div>
  );
}
