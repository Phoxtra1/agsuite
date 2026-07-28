import { describe, it, expect } from "vitest";
import { cellId, type SheetPage, type Workbook } from "@/lib/workspace/sheets/documents";
import {
  recommendSolution,
  seedHrSolutionToWorkbook,
  parseHrEmployees,
  updateSheetRecord,
  addSheetRecord,
  analyzeSheetData
} from "@/lib/workspace/sheets/smartData";

describe("HR Management Business Solution and Sync tests", () => {
  it("should recommend HR solution when relevant headers are present", () => {
    const sheet: SheetPage = {
      name: "Staff",
      cells: {
        [cellId(0, 0)]: "Employee ID",
        [cellId(0, 1)]: "Full Name",
        [cellId(0, 2)]: "Department"
      }
    };
    const rec = recommendSolution(sheet);
    expect(rec).toBe("HR");
  });

  it("should seed employees sheet with default structure and mock data", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };

    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);
    expect(seededWorkbook.sheets).toHaveLength(1);
    expect(seededWorkbook.sheets[0].name).toBe("Employees");
    expect(seededWorkbook.sheets[0].cells[cellId(0, 0)]).toBe("Employee ID");
    expect(seededWorkbook.sheets[0].cells[cellId(1, 0)]).toBe("EMP01");
    expect(seededWorkbook.sheets[0].cells[cellId(1, 1)]).toBe("Emmanuel Quaye");
  });

  it("should dynamically analyze sheet headers and columns", () => {
    const sheet: SheetPage = {
      name: "Custom HR",
      cells: {
        [cellId(0, 0)]: "Employee ID",
        [cellId(0, 1)]: "Employee Name",
        [cellId(0, 2)]: "Department",
        [cellId(0, 3)]: "Position",
        [cellId(0, 4)]: "Base Salary",
        [cellId(0, 5)]: "GPS Coordinates" // Dynamic Custom Column
      }
    };

    const analysis = analyzeSheetData(sheet);
    expect(analysis.hasEmployees).toBe(true);
    expect(analysis.hasDepartments).toBe(true);
    expect(analysis.hasPositions).toBe(true);
    expect(analysis.hasSalary).toBe(true);
    expect(analysis.customColumns).toContain("GPS Coordinates");
  });

  it("should support two-way synchronization: updating Employee sheet cells on record edit", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };
    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);
    const employeesSheet = seededWorkbook.sheets[0];

    // Edit employee EMP01's Position
    const updatedEmployeesSheet = updateSheetRecord(employeesSheet, 1, "Position", "Principal Systems Architect");
    expect(updatedEmployeesSheet.cells[cellId(1, 3)]).toBe("Principal Systems Architect");
  });

  it("should support two-way synchronization: adding new employees back to spreadsheet cells", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };
    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);
    const employeesSheet = seededWorkbook.sheets[0];

    const newEmp = {
      "Employee ID": "EMP04",
      "Employee Name": "Jules Agent",
      "Department": "Engineering",
      "Position": "Principal AI Assistant",
      "Status": "Active"
    };

    const updatedEmployeesSheet = addSheetRecord(employeesSheet, newEmp);
    // Find appended row index (which should be row 4)
    expect(updatedEmployeesSheet.cells[cellId(4, 0)]).toBe("EMP04");
    expect(updatedEmployeesSheet.cells[cellId(4, 1)]).toBe("Jules Agent");
    expect(updatedEmployeesSheet.cells[cellId(4, 2)]).toBe("Engineering");
    expect(updatedEmployeesSheet.cells[cellId(4, 3)]).toBe("Principal AI Assistant");
    expect(updatedEmployeesSheet.cells[cellId(4, 7)]).toBe("Active");
  });
});
