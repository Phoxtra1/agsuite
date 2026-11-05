import React from "react";
import { Clock, TrendingUp, ChevronRight, BookOpen, Trash2, Search, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecentTopicItem } from "@/lib/infoDiscovery/savedTopics";

interface PopularAndRecentProps {
  recentTopics: RecentTopicItem[];
  onSelectTopic: (catSlug: string, topicSlug: string) => void;
  onSelectRecent: (item: RecentTopicItem) => void;
  onClearRecent: () => void;
}

// Popular topics selected dynamically across diverse research domains
const POPULAR_TOPICS = [
  {
    categorySlug: "travel-destination",
    categoryTitle: "Travel and Destination",
    topicSlug: "visa-and-entry-requirements",
    topicTitle: "Visa and entry requirements",
    highlight: "Entry rules, passport criteria and official application routes",
  },
  {
    categorySlug: "career-development-education",
    categoryTitle: "Career Development and Education",
    topicSlug: "career-fields-and-professions",
    topicTitle: "Career fields and professions",
    highlight: "Work environments, realistic skills and learning progression",
  },
  {
    categorySlug: "it-innovation",
    categoryTitle: "IT and Innovation",
    topicSlug: "cybersecurity-and-access-control",
    topicTitle: "Cybersecurity and access control",
    highlight: "Identity, authentication, incident response and infrastructure",
  },
  {
    categorySlug: "business-management",
    categoryTitle: "Business Management",
    topicSlug: "internal-controls-and-loss-prevention",
    topicTitle: "Internal controls and loss prevention",
    highlight: "Verification, discrepancies and operational governance",
  },
];

export function PopularAndRecent({ recentTopics, onSelectTopic, onSelectRecent, onClearRecent }: PopularAndRecentProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 mb-8">
      {/* Popular Topics */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Suggested Starting Points</h2>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Curated suggestions
          </Badge>
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          A selection of useful subjects to help you begin exploring different areas.
        </p>

        <div className="mt-4 space-y-2">
          {POPULAR_TOPICS.map((item) => (
            <button
              key={item.topicSlug}
              type="button"
              onClick={() => item.kind === "topic" || !item.kind ? onSelectTopic(item.categorySlug, item.topicSlug) : onSelectRecent(item)}
              className="flex w-full items-start justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-left transition hover:bg-accent/5 hover:border-accent/40 group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition">
                  {item.topicTitle}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground line-clamp-1">
                  {item.categoryTitle} · {item.highlight}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition mt-1 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recently Viewed */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{recentTopics.length} items</Badge>{recentTopics.length > 0 && <button type="button" onClick={onClearRecent} aria-label="Clear recent activity" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Return to a subject, area or search you recently explored.
          </p>

          <div className="mt-4 space-y-2">
            {recentTopics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-40" />
                <p>No recent activity yet.</p>
                <p className="mt-1 text-[11px]">Opened areas, topics and submitted searches will appear here.</p>
              </div>
            ) : (
              recentTopics.slice(0, 5).map((item) => (
                <button
                  key={item.categorySlug + item.topicSlug + item.visitedAt}
                  type="button"
                  onClick={() => onSelectTopic(item.categorySlug, item.topicSlug)}
                  className="flex w-full items-start justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-left transition hover:bg-accent/5 hover:border-accent/40 group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition">
                      {item.topicTitle}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {item.kind === "search" ? "Search" : item.kind === "area" ? "Discovery area" : item.categoryTitle}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition mt-1 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
