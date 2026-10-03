import { describe, it, expect, beforeEach } from "vitest";
import { createDocument, getDocument, updateDocument, listDocuments } from "../documents";
import { createSheet, getSheet, updateSheet, listSheets } from "../sheets/documents";
import { createDeck, getDeck, updateDeck, listDecks } from "../slides/documents";
import { createForm, getFormById, updateForm, listForms } from "../forms/documents";

describe("Workspace Persistence Across All 4 Tools", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("Docs: creates, updates, and persists typed text after reload", async () => {
    const doc = await createDocument("Test Doc Title");
    expect(doc).toBeDefined();

    const updated = await updateDocument(doc.id, {
      title: "Updated Doc Title",
      content_text: "Hello world typed text in Docs",
      content_json: { type: "doc", content: [{ type: "paragraph", text: "Hello world" }] },
    });
    expect(updated).toBe(true);

    const reloaded = await getDocument(doc.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe("Updated Doc Title");
    expect(reloaded?.content_text).toBe("Hello world typed text in Docs");

    const allDocs = await listDocuments();
    expect(allDocs.some((d) => d.id === doc.id)).toBe(true);
  });

  it("Sheets: creates, updates, and persists workbook cell values after reload", async () => {
    const sheet = await createSheet("Test Sheet Title");
    expect(sheet).toBeDefined();

    const updatedWb = {
      sheets: [
        {
          name: "Sheet1",
          cells: {
            A1: "Revenue",
            B1: 5000,
          },
        },
      ],
      activeSheet: 0,
    };

    const updated = await updateSheet(sheet.id, {
      title: "Updated Sheet Title",
      workbook_json: updatedWb,
      content_text: "Revenue 5000",
    });
    expect(updated).toBe(true);

    const reloaded = await getSheet(sheet.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe("Updated Sheet Title");
    expect(reloaded?.workbook_json.sheets[0].cells.A1).toBe("Revenue");
    expect(reloaded?.workbook_json.sheets[0].cells.B1).toBe(5000);

    const allSheets = await listSheets();
    expect(allSheets.some((s) => s.id === sheet.id)).toBe(true);
  });

  it("Slides: creates, updates, and persists presentation slides after reload", async () => {
    const deck = await createDeck("Test Presentation Title");
    expect(deck).toBeDefined();

    const updatedDeckJson = {
      ...deck.deck_json,
      slides: [
        {
          ...deck.deck_json.slides[0],
          elements: [
            {
              id: "s1-text",
              kind: "text" as const,
              x: 100,
              y: 100,
              w: 500,
              h: 100,
              text: "Persisted Slide Text Content",
            },
          ],
        },
      ],
    };

    const updated = await updateDeck(deck.id, {
      title: "Updated Presentation Title",
      deck_json: updatedDeckJson,
      content_text: "Persisted Slide Text Content",
    });
    expect(updated).toBe(true);

    const reloaded = await getDeck(deck.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe("Updated Presentation Title");
    expect(reloaded?.deck_json.slides[0].elements[0].text).toBe("Persisted Slide Text Content");

    const allDecks = await listDecks();
    expect(allDecks.some((d) => d.id === deck.id)).toBe(true);
  });

  it("Forms: creates, updates, and persists questionnaire questions after reload", async () => {
    const form = await createForm("Test Form Title");
    expect(form).toBeDefined();

    const updated = await updateForm(form.id, {
      title: "Updated Form Title",
      questions: [
        {
          id: "q-1",
          type: "short_answer",
          title: "What is your primary workspace name?",
          required: true,
        },
      ],
    });
    expect(updated).toBe(true);

    const reloaded = await getFormById(form.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.title).toBe("Updated Form Title");
    expect(reloaded?.questions[0].title).toBe("What is your primary workspace name?");

    const allForms = await listForms();
    expect(allForms.some((f) => f.id === form.id)).toBe(true);
  });
});
