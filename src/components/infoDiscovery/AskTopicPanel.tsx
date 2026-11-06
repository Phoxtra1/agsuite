import React from "react";
import { ArrowUpRight, BookOpenCheck, Compass, FileSearch, ListChecks } from "lucide-react";

interface InvestigationGuideProps {
  topicTitle: string;
  categoryTitle: string;
  description: string;
  questions?: string[];
  referenceSources?: { name: string; url: string; scope: string }[];
}

/**
 * A structured investigation guide, not a conversational answer generator.
 * It helps people frame the question, inspect evidence and follow original
 * publishers. No synthetic answer is presented as verified research.
 */
export function AskTopicPanel({
  topicTitle,
  categoryTitle,
  description,
  questions = [],
  referenceSources = [],
}: InvestigationGuideProps) {
  const steps = [
    {
      icon: Compass,
      title: "Define what you need to understand",
      detail: `Set the context for “${topicTitle}”: the place, people, time period and decision involved.`,
    },
    {
      icon: ListChecks,
      title: "Work through the investigation questions",
      detail: questions.length
        ? `Use the ${questions.length} questions in this guide to break the subject into verifiable parts.`
        : "Break the subject into smaller questions that can be checked independently.",
    },
    {
      icon: FileSearch,
      title: "Check the original evidence",
      detail: "Follow the source to its original publisher. Check its authority, date, scope, method and limitations before relying on a claim.",
    },
  ];

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BookOpenCheck className="h-4 w-4 text-primary" />
        How to investigate this topic
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Amineva organises a subject into a clear investigation path. It does not replace the original evidence with an automatically generated answer.
      </p>
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-background text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{index + 1}. {step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      {referenceSources.length > 0 && (
        <div className="mt-4 border-t border-primary/15 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Original sources to begin with
          </p>
          <div className="space-y-2">
            {referenceSources.slice(0, 4).map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs transition hover:border-primary/30 hover:bg-background"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{source.name}</span>
                  <span className="mt-0.5 block leading-4 text-muted-foreground">{source.scope}</span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
        Investigation area: {categoryTitle}. Guide context: {description}
      </p>
    </section>
  );
}
