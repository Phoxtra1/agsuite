import { wsKey } from "@/lib/workspace/scope";
import { createDocument, updateDocument } from "@/lib/workspace/documents";
import { textToDocJson } from "@/lib/workspace/importers";

export interface SavedTopicItem {
  id: string;
  categorySlug: string;
  categoryTitle: string;
  topicTitle: string;
  topicSlug: string;
  description: string;
  questions?: string[];
  sources?: { name: string; url: string; scope: string }[];
  savedAt: string;
  notes?: string;
  workspaceDocId?: string;
}

const STORAGE_KEY = "amineva_saved_topics";

export function getSavedTopics(): SavedTopicItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(wsKey(STORAGE_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTopicBookmark(item: Omit<SavedTopicItem, "id" | "savedAt">): SavedTopicItem {
  const current = getSavedTopics();
  const existing = current.find(
    (t) => t.categorySlug === item.categorySlug && t.topicSlug === item.topicSlug
  );
  if (existing) return existing;

  const newItem: SavedTopicItem = {
    ...item,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    savedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(wsKey(STORAGE_KEY), JSON.stringify(updated));
  } catch (e) {
    console.error("[SavedTopics] Failed to save", e);
  }
  return newItem;
}

export function removeSavedTopic(id: string): void {
  const current = getSavedTopics();
  const updated = current.filter((t) => t.id !== id);
  try {
    localStorage.setItem(wsKey(STORAGE_KEY), JSON.stringify(updated));
  } catch (e) {
    console.error("[SavedTopics] Failed to remove", e);
  }
}

export function isTopicSaved(categorySlug: string, topicSlug: string): boolean {
  const current = getSavedTopics();
  return current.some((t) => t.categorySlug === categorySlug && t.topicSlug === topicSlug);
}

/**
 * Creates an Amineva Docs document in the user's Workspace from a saved topic or research record.
 */
export async function sendTopicToWorkspace(topic: {
  title: string;
  categoryTitle: string;
  description: string;
  questions?: string[];
  sources?: { name: string; url: string; scope?: string }[];
  notes?: string;
  mainGoal?: string;
  numberToTrack?: string;
}): Promise<{ docId: string; title: string }> {
  const title = `Research: ${topic.title}`;

  const mdLines: string[] = [
    `# ${topic.title}`,
    `*Investigation Area: ${topic.categoryTitle}*`,
    "",
    "## Overview and Context",
    topic.description,
    "",
  ];

  if (topic.mainGoal || topic.numberToTrack) {
    mdLines.push("## Project Investigation Plan");
    if (topic.mainGoal) mdLines.push(`**Main Project Goal:** ${topic.mainGoal}`);
    if (topic.numberToTrack) mdLines.push(`**Key Metric to Track:** ${topic.numberToTrack}`);
    mdLines.push("");
  }

  if (topic.questions && topic.questions.length > 0) {
    mdLines.push("## Core Questions to Investigate");
    topic.questions.forEach((q, i) => mdLines.push(`${i + 1}. ${q}`));
    mdLines.push("");
  }

  if (topic.sources && topic.sources.length > 0) {
    mdLines.push("## Authoritative Reference Sources");
    topic.sources.forEach((s) => {
      const scopeText = s.scope ? ` - ${s.scope}` : "";
      mdLines.push(`- **[${s.name}](${s.url})**${scopeText}`);
    });
    mdLines.push("");
  }

  mdLines.push(
    "## Research Notes and Findings",
    topic.notes || "Add your findings, field notes, source references, and verified metrics here.",
    "",
    `*Document initialized from Amineva Info Discovery on ${new Date().toLocaleDateString()}.*`
  );

  const fullText = mdLines.join("\n");
  const docJson = textToDocJson(fullText);

  const doc = await createDocument(title);
  await updateDocument(doc.id, {
    title,
    content_json: docJson,
    content_text: fullText,
  });

  return { docId: doc.id, title };
}

// Track recently viewed topics
const RECENT_KEY = "amineva_recent_topics";

export interface RecentTopicItem {
  categorySlug: string;
  categoryTitle: string;
  topicSlug: string;
  topicTitle: string;
  visitedAt: string;
}

export function recordRecentTopic(item: Omit<RecentTopicItem, "visitedAt">) {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(wsKey(RECENT_KEY));
    const list: RecentTopicItem[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(
      (r) => !(r.categorySlug === item.categorySlug && r.topicSlug === item.topicSlug)
    );
    const updated = [{ ...item, visitedAt: new Date().toISOString() }, ...filtered].slice(0, 8);
    localStorage.setItem(wsKey(RECENT_KEY), JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function getRecentTopics(): RecentTopicItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(wsKey(RECENT_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
