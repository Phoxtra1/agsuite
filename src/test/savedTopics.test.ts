import { describe, it, expect, beforeEach } from "bun:test";
import {
  saveTopicBookmark,
  removeSavedTopic,
  isTopicSaved,
  getSavedTopics,
  recordRecentTopic,
  getRecentTopics,
  sendTopicToWorkspace,
} from "@/lib/infoDiscovery/savedTopics";
import { getDocument } from "@/lib/workspace/documents";

// Mock localStorage in bun test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: storageMock,
    writable: true,
  });
}

if (typeof globalThis.window === "undefined") {
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    writable: true,
  });
}

describe("Info Discovery Saved Topics & Workspace Integration", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it("bookmarks a topic and checks existence", () => {
    const topic = {
      categorySlug: "travel-destination",
      categoryTitle: "Travel and Destination",
      topicSlug: "visa-requirements",
      topicTitle: "Visa and entry requirements",
      description: "Understand entry rules, passport validity, and visa applications.",
    };

    expect(isTopicSaved("travel-destination", "visa-requirements")).toBe(false);
    const saved = saveTopicBookmark(topic);
    expect(isTopicSaved("travel-destination", "visa-requirements")).toBe(true);

    const list = getSavedTopics();
    expect(list.length).toBe(1);
    expect(list[0].topicSlug).toBe("visa-requirements");

    removeSavedTopic(saved.id);
    expect(isTopicSaved("travel-destination", "visa-requirements")).toBe(false);
    expect(getSavedTopics().length).toBe(0);
  });

  it("sends a saved topic directly to Amineva Docs workspace", async () => {
    const topic = {
      title: "Career Change Roadmap",
      categoryTitle: "Career Development and Education",
      description: "Strategic roadmap for technical career transitions.",
      questions: ["What are transferable skills?", "How to assess demand?"],
      sources: [
        { name: "Ministry of Education Guide", url: "https://example.gov", scope: "Official" },
      ],
      mainGoal: "Plan transition to Cloud Engineering",
      numberToTrack: "Complete 3 certifications by Q4",
    };

    const res = await sendTopicToWorkspace(topic);

    expect(res).toBeDefined();
    expect(res.docId).toBeDefined();
    expect(res.title).toContain("Career Change Roadmap");

    const savedDoc = await getDocument(res.docId);
    expect(savedDoc).toBeDefined();
    expect(savedDoc?.title).toContain("Career Change Roadmap");
  });

  it("records and retrieves recently viewed topics", () => {
    recordRecentTopic({
      categorySlug: "area-1",
      categoryTitle: "Area 1",
      topicSlug: "topic-1",
      topicTitle: "First Topic",
    });

    recordRecentTopic({
      categorySlug: "area-2",
      categoryTitle: "Area 2",
      topicSlug: "topic-2",
      topicTitle: "Second Topic",
    });

    const recents = getRecentTopics();
    expect(recents.length).toBe(2);
    expect(recents[0].topicSlug).toBe("topic-2"); // Latest first
    expect(recents[1].topicSlug).toBe("topic-1");
  });
});
