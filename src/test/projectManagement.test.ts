import { describe, it, expect } from "vitest";
import { cellId, type SheetPage, type Workbook } from "@/lib/workspace/sheets/documents";
import {
  profileColumns,
  recommendSolution,
  seedSolutionToSheet,
  parseSheetRows,
  updateSheetRecord,
  addSheetRecord,
  SOLUTIONS_TEMPLATES
} from "@/lib/workspace/sheets/smartData";

describe("Amineva Project Management Business Solution tests", () => {
  it("should profile project-specific columns correctly", () => {
    const sheet: SheetPage = {
      name: "Projects",
      cells: {
        [cellId(0, 0)]: "Project ID",
        [cellId(0, 1)]: "Project Name",
        [cellId(0, 2)]: "Start Date",
        [cellId(0, 3)]: "Budget ($)"
      }
    };

    const profiles = profileColumns(sheet);
    expect(profiles[0].type).toBe("number");
    expect(profiles[2].type).toBe("date");
    expect(profiles[3].type).toBe("currency");
  });

  it("should successfully recommend Project Management from custom headers", () => {
    const customSheet: SheetPage = {
      name: "Planning Hub",
      cells: {
        [cellId(0, 0)]: "Project Name",
        [cellId(0, 1)]: "Project Manager",
        [cellId(0, 2)]: "Start Date",
        [cellId(0, 3)]: "End Date",
        [cellId(0, 4)]: "Budget"
      }
    };

    const match = recommendSolution(customSheet);
    expect(match).toBe("ProjectManagement");
  });

  it("should seed template multi-sheet structures correctly", () => {
    const blankProjectsSheet: SheetPage = { name: "Projects", cells: {} };
    const seeded = seedSolutionToSheet(blankProjectsSheet, "ProjectManagement");

    expect(seeded.cells[cellId(0, 0)]).toBe("Project ID");
    expect(seeded.cells[cellId(0, 1)]).toBe("Project Name");
    expect(seeded.cells[cellId(1, 0)]).toBe("PRJ-001");
    expect(seeded.cells[cellId(1, 1)]).toBe("Agyenkwa Climate Initiative");
  });

  it("should parse multiple rows into typed record entries", () => {
    const sheet: SheetPage = {
      name: "Projects",
      cells: {
        [cellId(0, 0)]: "Project ID",
        [cellId(0, 1)]: "Project Name",
        [cellId(0, 2)]: "Project Owner",
        [cellId(0, 3)]: "Status",

        // Row 1
        [cellId(1, 0)]: "PRJ-001",
        [cellId(1, 1)]: "Agyenkwa Climate Initiative",
        [cellId(1, 2)]: "JICA",
        [cellId(1, 3)]: "Active"
      }
    };

    const parsed = parseSheetRows(sheet);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].status).toBe("Active");
  });
});
