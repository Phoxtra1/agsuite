import { describe, it, expect } from "vitest";
import { cellId, type SheetPage, type Workbook } from "@/lib/workspace/sheets/documents";
import {
  recommendSolution,
  seedHrSolutionToWorkbook,
  parseHrEmployees,
  parseHrDepartments,
  parseHrPositions,
  parseHrAttendance,
  parseHrLeave,
  parseHrPerformance,
  parseHrRecruitment,
  parseHrOnboarding,
  updateSheetRecord,
  addSheetRecord
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

  it("should seed 8 distinct sheets with default structure and mock data", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };

    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);
    expect(seededWorkbook.sheets).toHaveLength(8);

    // Verify sheet names
    const names = seededWorkbook.sheets.map(s => s.name);
    expect(names).toContain("Employees");
    expect(names).toContain("Departments");
    expect(names).toContain("Positions");
    expect(names).toContain("Attendance");
    expect(names).toContain("Leave");
    expect(names).toContain("Performance");
    expect(names).toContain("Recruitment");
    expect(names).toContain("Onboarding");

    // Verify first sheet (Employees) contains mock employees data
    const employeesSheet = seededWorkbook.sheets.find(s => s.name === "Employees")!;
    expect(employeesSheet.cells[cellId(0, 0)]).toBe("Employee ID");
    expect(employeesSheet.cells[cellId(1, 0)]).toBe("EMP001");
    expect(employeesSheet.cells[cellId(1, 3)]).toBe("Emmanuel Quaye");
  });

  it("should extract correctly typed record sets from each supplemental sheet", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };
    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);

    const employees = parseHrEmployees(seededWorkbook);
    const departments = parseHrDepartments(seededWorkbook);
    const positions = parseHrPositions(seededWorkbook);
    const attendance = parseHrAttendance(seededWorkbook);
    const leave = parseHrLeave(seededWorkbook);
    const performance = parseHrPerformance(seededWorkbook);
    const recruitment = parseHrRecruitment(seededWorkbook);
    const onboarding = parseHrOnboarding(seededWorkbook);

    expect(employees.length).toBeGreaterThan(0);
    expect(departments.length).toBeGreaterThan(0);
    expect(positions.length).toBeGreaterThan(0);
    expect(attendance.length).toBeGreaterThan(0);
    expect(leave.length).toBeGreaterThan(0);
    expect(performance.length).toBeGreaterThan(0);
    expect(recruitment.length).toBeGreaterThan(0);
    expect(onboarding.length).toBeGreaterThan(0);

    // Verify specific properties
    expect(employees[0]["Employee ID"]).toBe("EMP001");
    expect(departments[0]["Department Name"]).toBe("Engineering");
    expect(positions[0]["Position Title"]).toBe("Senior Software Engineer");
    expect(attendance[0]["Attendance Status"]).toBe("Present");
    expect(leave[0]["Leave Type"]).toBe("Annual Leave");
    expect(performance[0]["Rating"]).toBe(5);
    expect(recruitment[0]["Job Title"]).toBe("Front-End Engineer");
    expect(onboarding[0]["Documents Submitted"]).toBe("Yes");
  });

  it("should support two-way synchronization: updating Employee sheet cells on record edit", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };
    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);
    const employeesSheet = seededWorkbook.sheets.find(s => s.name === "Employees")!;

    // Edit employee EMP001's Position
    const updatedEmployeesSheet = updateSheetRecord(employeesSheet, 1, "Position", "Principal Systems Architect");
    expect(updatedEmployeesSheet.cells[cellId(1, 18)]).toBe("Principal Systems Architect");
  });

  it("should support two-way synchronization: adding new employees back to spreadsheet cells", () => {
    const initialWorkbook: Workbook = {
      sheets: [{ name: "Sheet1", cells: {} }],
      activeSheet: 0
    };
    const seededWorkbook = seedHrSolutionToWorkbook(initialWorkbook);
    const employeesSheet = seededWorkbook.sheets.find(s => s.name === "Employees")!;

    const newEmp = {
      "Employee ID": "EMP005",
      "Full Name": "Jules Agent",
      "Department": "Engineering",
      "Position": "Principal AI Assistant",
      "Employment Status": "Active"
    };

    const updatedEmployeesSheet = addSheetRecord(employeesSheet, newEmp);
    // Find appended row index (which should be row 5)
    expect(updatedEmployeesSheet.cells[cellId(5, 0)]).toBe("EMP005");
    expect(updatedEmployeesSheet.cells[cellId(5, 3)]).toBe("Jules Agent");
    expect(updatedEmployeesSheet.cells[cellId(5, 17)]).toBe("Engineering");
    expect(updatedEmployeesSheet.cells[cellId(5, 18)]).toBe("Principal AI Assistant");
    expect(updatedEmployeesSheet.cells[cellId(5, 13)]).toBe("Active");
  });
});
