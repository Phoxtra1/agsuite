import { describe, it, expect } from "vitest";
import { rowsToSheetPage, textToSlideBlocks, linesToQuestions, textToDocJson } from "../importers";

describe("workspace importers", () => {
  it("maps rows to A1 cells", () => {
    const p = rowsToSheetPage("S", [["Name", "Age"], ["Ama", 30]]);
    expect(p.cells).toEqual({ A1: "Name", B1: "Age", A2: "Ama", B2: 30 });
  });
  it("splits markdown headings into slides", () => {
    expect(textToSlideBlocks("# One\nbody\n# Two")).toEqual([{ title: "One", body: "body" }, { title: "Two", body: "" }]);
  });
  it("parses choice questions and required marker", () => {
    const [q] = linesToQuestions("Favourite colour*, Red|Blue");
    expect(q).toMatchObject({ title: "Favourite colour", type: "multiple_choice", options: ["Red", "Blue"], required: true });
  });
  it("turns # lines into headings", () => {
    expect(textToDocJson("# Hi").content[0]).toMatchObject({ type: "heading", attrs: { level: 1 } });
  });
});
