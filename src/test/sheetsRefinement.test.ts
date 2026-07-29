import { describe, it, expect } from "vitest";
import { cellId, parseCell, parseMergeRange, type SheetPage } from "@/lib/workspace/sheets/documents";
import { buildEngine } from "@/lib/workspace/sheets/engine";

describe("Amineva Sheets Refined Spreadsheet Engine tests", () => {
  it("should parse merge ranges correctly", () => {
    const range1 = parseMergeRange("A1:C3");
    expect(range1).not.toBeNull();
    expect(range1!.r1).toBe(0);
    expect(range1!.c1).toBe(0);
    expect(range1!.r2).toBe(2);
    expect(range1!.c2).toBe(2);

    const range2 = parseMergeRange("D5:E6");
    expect(range2!.r1).toBe(4);
    expect(range2!.c1).toBe(3);
    expect(range2!.r2).toBe(5);
    expect(range2!.c2).toBe(4);

    const invalid = parseMergeRange("A1");
    expect(invalid).toBeNull();
  });

  it("should calculate correct formula values using the buildEngine helper", () => {
    const wb = {
      sheets: [
        {
          name: "Sheet1",
          cells: {
            "A1": 10,
            "A2": 20,
            "A3": "=SUM(A1:A2)",
          },
        },
      ],
      activeSheet: 0,
    };

    const engine = buildEngine(wb);
    expect(engine.getCell("Sheet1", 0, 0)).toBe(10);
    expect(engine.getCell("Sheet1", 1, 0)).toBe(20);
    expect(engine.getCell("Sheet1", 2, 0)).toBe(30);

    // Update A1 value and check recalculation on engine rebuild
    wb.sheets[0].cells["A1"] = 50;
    const newEngine = buildEngine(wb);
    expect(newEngine.getCell("Sheet1", 0, 0)).toBe(50);
    expect(newEngine.getCell("Sheet1", 2, 0)).toBe(70);

    engine.destroy();
    newEngine.destroy();
  });

  it("should support custom vertical alignment, fonts, and borders", () => {
    const sheet: SheetPage = {
      name: "Sheet1",
      cells: {
        "A1": "Refined Cell",
      },
      formats: {
        "A1": {
          bold: true,
          italic: true,
          valign: "top",
          fontSize: 14,
          fontFamily: "monospace",
          border: "all",
        },
      },
    };

    const fmt = sheet.formats!["A1"];
    expect(fmt.bold).toBe(true);
    expect(fmt.italic).toBe(true);
    expect(fmt.valign).toBe("top");
    expect(fmt.fontSize).toBe(14);
    expect(fmt.fontFamily).toBe("monospace");
    expect(fmt.border).toBe("all");
  });
});
