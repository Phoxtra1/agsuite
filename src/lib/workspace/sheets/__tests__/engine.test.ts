import { describe, it, expect } from "vitest";
import { buildEngine } from "../engine";
import type { Workbook } from "../documents";

describe("Sheets Calculation Engine Robustness", () => {
  it("builds engine safely with sparse cells without crashing", () => {
    const wb: Workbook = {
      sheets: [
        {
          name: "Sheet1",
          cells: {
            D6: 1234,
            F10: "=D6 * 2",
          },
        },
      ],
      activeSheet: 0,
    };

    const engine = buildEngine(wb);
    expect(engine).toBeDefined();
    expect(engine.getCell("Sheet1", 5, 3)).toBe(1234);
    expect(engine.getCell("Sheet1", 9, 5)).toBe(2468);
    engine.destroy();
  });

  it("handles duplicate sheet names gracefully without throwing", () => {
    const wb: Workbook = {
      sheets: [
        { name: "Sheet1", cells: { A1: 10 } },
        { name: "Sheet1", cells: { A1: 20 } },
      ],
      activeSheet: 0,
    };

    const engine = buildEngine(wb);
    expect(engine).toBeDefined();
    expect(engine.getCell("Sheet1", 0, 0)).toBe(10);
    expect(engine.getCell("Sheet1_2", 0, 0)).toBe(20);
    engine.destroy();
  });

  it("handles empty workbooks cleanly", () => {
    const wb: Workbook = {
      sheets: [],
      activeSheet: 0,
    };

    const engine = buildEngine(wb);
    expect(engine).toBeDefined();
    engine.destroy();
  });
});
