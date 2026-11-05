import React, { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (loading) return;

    setExpanded(true);
    setLoading(true);
    setError("");

    try {
      const res = await askAboutTopic({
        topicTitle,
        categoryTitle,
        description,
        questions,
        referenceSources,
      });
      setResult(res);
    } catch {
      setError("We couldn't retrieve the information for this topic. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Ask about this topic
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Explore a concise overview, key points and relevant reference sources for this subject.
          </p>
        </div>

        {!expanded && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAsk}
            disabled={loading}
            className="w-full justify-between border-primary/30 text-xs font-semibold hover:bg-primary/10"
          >
            Ask about this topic
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        )}

        {expanded && (
          <div className="space-y-3 border-t border-primary/15 pt-3" aria-live="polite">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Gathering information…
              </div>
            )}

            {error && !loading && (
              <div role="alert" className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                {error}
                <button
                  type="button"
                  onClick={handleAsk}
                  className="ml-1 font-semibold text-primary underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}

            {result && !loading && (
              <>
                <p className="text-xs leading-6 text-foreground">{result.summary}</p>

                {result.keyTakeaways.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold text-foreground">
                      Key points
                    </p>
                    <ul className="space-y-1.5">
                      {result.keyTakeaways.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-5 text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.sources.length > 0 && (
                  <div className="border-t border-border/50 pt-2">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.sources.map((source) => (
                        <span
                          key={source.name}
                          title={source.scope || source.name}
                          className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                        >
                          {source.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {expanded && !loading && (
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setError("");
          }}
          className="mt-3 text-left text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Hide information
        </button>
      )}
    </section>
  );
}
