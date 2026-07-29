import { describe, it, expect } from "vitest";
import { cellId, type SheetPage, type Workbook } from "@/lib/workspace/sheets/documents";
import {
  profileColumns,
  seedSolutionToSheet,
  parseSheetRows,
  updateSheetRecord,
  addSheetRecord,
  analyzeSheetDataForCustomSolution
} from "@/lib/workspace/sheets/smartData";

// Helper function to simulate custom metrics computation (analogous to DashboardEngine.tsx logic)
function computeMetricValue(records: any[], metric: any): number {
  let count = 0;
  let sum = 0;

  let condCol = "";
  let condVal = "";
  if (metric.condition && metric.condition.includes("=")) {
    const parts = metric.condition.split("=");
    condCol = parts[0]?.trim();
    condVal = parts[1]?.trim().replace(/['"]/g, "");
  }

  records.forEach((r) => {
    if (condCol && condVal) {
      const actualVal = String(r[condCol] || "").toLowerCase().trim();
      if (actualVal !== condVal.toLowerCase().trim()) return;
    }

    const cellVal = Number(r[metric.column]) || 0;
    sum += cellVal;
    count++;
  });

  return metric.formula === "SUM" ? sum : metric.formula === "AVG" ? (count > 0 ? sum / count : 0) : count;
}

// Helper to simulate custom chart grouping (analogous to DashboardEngine.tsx charts logic)
function aggregateChartData(records: any[], xKey: string, yKey: string) {
  const groups: Record<string, number> = {};
  records.forEach((r) => {
    const xVal = String(r[xKey] || "Unknown");
    const yVal = Number(r[yKey]) || 1;
    groups[xVal] = (groups[xVal] || 0) + yVal;
  });
  return Object.entries(groups).map(([name, value]) => ({ name, value }));
}

describe("Amineva Sheets Custom Solution tests", () => {
  it("should calculate custom SUM and COUNT metric formulas from spreadsheet records", () => {
    const records = [
      { "Date": "2026-04-10", "Category": "Revenue", "Amount": 5000, "Status": "Cleared" },
      { "Date": "2026-04-11", "Category": "Expense", "Amount": 1200, "Status": "Cleared" },
      { "Date": "2026-04-12", "Category": "Revenue", "Amount": 3000, "Status": "Pending" },
      { "Date": "2026-04-13", "Category": "Expense", "Amount": 800, "Status": "Cleared" }
    ];

    const revMetric = { label: "Total Revenue", formula: "SUM", column: "Amount", condition: "Category = Revenue" };
    const revVal = computeMetricValue(records, revMetric);
    expect(revVal).toBe(8000); // 5000 + 3000

    const clearedMetric = { label: "Cleared Transactions", formula: "COUNT", column: "Status", condition: "Status = Cleared" };
    const clearedVal = computeMetricValue(records, clearedMetric);
    expect(clearedVal).toBe(3); // 3 cleared rows
  });

  it("should aggregate and group custom charts data based on dynamic xKey and yKey fields", () => {
    const records = [
      { "Category": "Revenue", "Amount": 5000 },
      { "Category": "Expense", "Amount": 1200 },
      { "Category": "Revenue", "Amount": 3000 },
      { "Category": "Expense", "Amount": 800 }
    ];

    const chartData = aggregateChartData(records, "Category", "Amount");
    expect(chartData).toHaveLength(2);

    const revGroup = chartData.find(d => d.name === "Revenue");
    const expGroup = chartData.find(d => d.name === "Expense");

    expect(revGroup?.value).toBe(8000);
    expect(expGroup?.value).toBe(2000);
  });

  it("should synchronize Custom Solution records with the spreadsheet via two-way sync on edit", () => {
    const sheet: SheetPage = {
      name: "Accounting",
      cells: {
        [cellId(0, 0)]: "Date",
        [cellId(0, 1)]: "Account Name",
        [cellId(0, 2)]: "Amount",

        // Row 1
        [cellId(1, 0)]: "2026-04-10",
        [cellId(1, 1)]: "Consulting",
        [cellId(1, 2)]: 5000
      }
    };

    const updated = updateSheetRecord(sheet, 1, "Amount", 6500);
    expect(updated.cells[cellId(1, 2)]).toBe(6500);

    const rows = parseSheetRows(updated);
    expect(rows[0]["Amount"]).toBe(6500);
  });

  it("should support adding new records dynamically inside the Custom Solution", () => {
    const sheet: SheetPage = {
      name: "Compliance",
      cells: {
        [cellId(0, 0)]: "Regulation",
        [cellId(0, 1)]: "Status",

        // Row 1
        [cellId(1, 0)]: "GDPR",
        [cellId(1, 1)]: "Compliant"
      }
    };

    const newRec = {
      "Regulation": "BoG FinTech Guidelines",
      "Status": "Under Review"
    };

    const updated = addSheetRecord(sheet, newRec);
    expect(updated.cells[cellId(2, 0)]).toBe("BoG FinTech Guidelines");
    expect(updated.cells[cellId(2, 1)]).toBe("Under Review");
  });

  it("should analyze sheet columns dynamically to extract status, dates, and infer solution configurations", () => {
    const complianceSheet: SheetPage = {
      name: "Corporate Audit Tracker",
      cells: {
        [cellId(0, 0)]: "Audit Check ID",
        [cellId(0, 1)]: "Process Area",
        [cellId(0, 2)]: "Audit Status",
        [cellId(0, 3)]: "Compliance Date",
        [cellId(0, 4)]: "Findings Summary",
        [cellId(0, 5)]: "Risk Level Classification"
      }
    };

    const suggested = analyzeSheetDataForCustomSolution(complianceSheet);

    // Assert correct solution type inference based on header keywords
    expect(suggested.solutionType).toBe("audit");
    expect(suggested.solutionName).toBe("Dynamic Audit & Findings Registry");

    // Assert correct auto-detected Kanban Status column
    expect(suggested.statusCol).toBe("Audit Status");

    // Assert correct auto-detected Scheduler Date column
    expect(suggested.dateCol).toBe("Compliance Date");
  });
});
