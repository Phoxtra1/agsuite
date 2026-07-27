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

describe("Amineva Sheets Smart Business Solution tests", () => {
  it("should profile column type correctly based on headers", () => {
    const sheet: SheetPage = {
      name: "Partner Tracker",
      cells: {
        [cellId(0, 0)]: "Organization Name",
        [cellId(0, 1)]: "Client Email",
        [cellId(0, 2)]: "Telephone",
        [cellId(0, 3)]: "Pipeline Status",
        [cellId(0, 4)]: "Date of follow-up",
        [cellId(0, 5)]: "Deal Value ($)"
      }
    };

    const profiles = profileColumns(sheet);
    expect(profiles).toHaveLength(6);

    // Assert correct column profiling types
    expect(profiles[0].type).toBe("company");
    expect(profiles[1].type).toBe("email");
    expect(profiles[2].type).toBe("phone");
    expect(profiles[3].type).toBe("status");
    expect(profiles[4].type).toBe("date");
    expect(profiles[5].type).toBe("currency");
  });

  it("should correctly recommend the best business solution template", () => {
    const sheetWithCrmHeaders: SheetPage = {
      name: "Contacts",
      cells: {
        [cellId(0, 0)]: "Organization",
        [cellId(0, 1)]: "Contact Person",
        [cellId(0, 2)]: "Email Address",
        [cellId(0, 3)]: "Phone Number",
        [cellId(0, 4)]: "Status"
      }
    };

    const rec = recommendSolution(sheetWithCrmHeaders);
    expect(rec).toBe("CRM");
  });

  it("should seed template structures and mock data into a blank sheet", () => {
    const blankSheet: SheetPage = { name: "Sheet1", cells: {} };

    // Seed CRM Solution
    const seeded = seedSolutionToSheet(blankSheet, "CRM");
    expect(seeded.cells[cellId(0, 0)]).toBe("Organization");
    expect(seeded.cells[cellId(0, 1)]).toBe("Contact Person");
    expect(seeded.cells[cellId(0, 4)]).toBe("Status");

    // Check first default row values
    expect(seeded.cells[cellId(1, 0)]).toBe("Japan International Cooperation Agency");
    expect(seeded.cells[cellId(1, 1)]).toBe("Programme Officer");
    expect(seeded.cells[cellId(1, 4)]).toBe("Meeting Scheduled");
  });

  it("should parse spreadsheet cell matrices into typed record objects", () => {
    const sheet: SheetPage = {
      name: "Pipeline",
      cells: {
        [cellId(0, 0)]: "Organization",
        [cellId(0, 1)]: "Contact Person",
        [cellId(0, 2)]: "Email",
        [cellId(0, 3)]: "Phone",
        [cellId(0, 4)]: "Status",
        [cellId(0, 5)]: "Value",

        // Row 1
        [cellId(1, 0)]: "Japan International Cooperation Agency",
        [cellId(1, 1)]: "Programme Officer",
        [cellId(1, 2)]: "info@jica.go.jp",
        [cellId(1, 3)]: "+233 302 760781",
        [cellId(1, 4)]: "Meeting Scheduled",
        [cellId(1, 5)]: 150000,

        // Row 2
        [cellId(2, 0)]: "Agyenkwa Trust Bank",
        [cellId(2, 1)]: "Kofi Mensah",
        [cellId(2, 2)]: "k.mensah@agyenkwatrust.com",
        [cellId(2, 3)]: "+233 244 123456",
        [cellId(2, 4)]: "Proposal Sent",
        [cellId(2, 5)]: 45000
      }
    };

    const rows = parseSheetRows(sheet);
    expect(rows).toHaveLength(2);

    expect(rows[0].rowIndex).toBe(1);
    expect(rows[0].organizationName).toBe("Japan International Cooperation Agency");
    expect(rows[0].contactName).toBe("Programme Officer");
    expect(rows[0].email).toBe("info@jica.go.jp");
    expect(rows[0].status).toBe("Meeting Scheduled");
    expect(rows[0].value).toBe(150000);

    expect(rows[1].rowIndex).toBe(2);
    expect(rows[1].organizationName).toBe("Agyenkwa Trust Bank");
    expect(rows[1].contactName).toBe("Kofi Mensah");
    expect(rows[1].status).toBe("Proposal Sent");
  });

  it("should support two-way synchronization: updating sheet cells from record fields", () => {
    const sheet: SheetPage = {
      name: "CRM Sheet",
      cells: {
        [cellId(0, 0)]: "Organization",
        [cellId(0, 1)]: "Contact Person",
        [cellId(0, 4)]: "Status",

        // Row 1
        [cellId(1, 0)]: "Japan International Cooperation Agency",
        [cellId(1, 1)]: "Programme Officer",
        [cellId(1, 4)]: "Meeting Scheduled"
      }
    };

    // Update Row 1 status to "Negotiation"
    const updated = updateSheetRecord(sheet, 1, "status", "Negotiation");
    expect(updated.cells[cellId(1, 4)]).toBe("Negotiation");

    // Update Row 1 Contact Name
    const updatedContact = updateSheetRecord(updated, 1, "contactName", "Lead Officer");
    expect(updatedContact.cells[cellId(1, 1)]).toBe("Lead Officer");
  });

  it("should support two-way synchronization: adding a new record to the sheet cells", () => {
    const sheet: SheetPage = {
      name: "CRM Sheet",
      cells: {
        [cellId(0, 0)]: "Organization",
        [cellId(0, 1)]: "Contact Person",
        [cellId(0, 4)]: "Status",

        // Row 1
        [cellId(1, 0)]: "Japan International Cooperation Agency",
        [cellId(1, 1)]: "Programme Officer",
        [cellId(1, 4)]: "Meeting Scheduled"
      }
    };

    const newRecord = {
      organizationName: "Agyenkwa Trust Bank",
      contactName: "Kofi Mensah",
      status: "Proposal Sent"
    };

    const updated = addSheetRecord(sheet, newRecord);
    // Verify Row 2 is appended correctly
    expect(updated.cells[cellId(2, 0)]).toBe("Agyenkwa Trust Bank");
    expect(updated.cells[cellId(2, 1)]).toBe("Kofi Mensah");
    expect(updated.cells[cellId(2, 4)]).toBe("Proposal Sent");
  });

  it("should seed Registry template with core fields and demo records correctly", () => {
    const blankSheet: SheetPage = { name: "Sheet2", cells: {} };

    // Seed Registry Solution
    const seeded = seedSolutionToSheet(blankSheet, "Registry");
    expect(seeded.cells[cellId(0, 0)]).toBe("Record ID");
    expect(seeded.cells[cellId(0, 1)]).toBe("Name");
    expect(seeded.cells[cellId(0, 2)]).toBe("Category");
    expect(seeded.cells[cellId(0, 4)]).toBe("Status");

    // Check first default row values for versatile farmers registry
    expect(seeded.cells[cellId(1, 0)]).toBe("REG-001");
    expect(seeded.cells[cellId(1, 1)]).toBe("Kofi Mensah");
    expect(seeded.cells[cellId(1, 2)]).toBe("Farmers");
    expect(seeded.cells[cellId(1, 4)]).toBe("Active");
  });

  it("should parse dynamic spreadsheet custom columns as dynamic fields", () => {
    const sheet: SheetPage = {
      name: "Dynamic Registry",
      cells: {
        [cellId(0, 0)]: "Record ID",
        [cellId(0, 1)]: "Name",
        [cellId(0, 2)]: "Category",
        [cellId(0, 3)]: "Status",
        [cellId(0, 4)]: "Farm Size",
        [cellId(0, 5)]: "GPS Coordinates",

        // Row 1
        [cellId(1, 0)]: "REG-201",
        [cellId(1, 1)]: "Ebenezer Ocloo",
        [cellId(1, 2)]: "Farmers",
        [cellId(1, 3)]: "Active",
        [cellId(1, 4)]: "50 Acres",
        [cellId(1, 5)]: "5.6037° N, 0.1870° W"
      }
    };

    const parsed = parseSheetRows(sheet);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]["Record ID"]).toBe("REG-201");
    expect(parsed[0].Name).toBe("Ebenezer Ocloo");
    expect(parsed[0].Category).toBe("Farmers");
    expect(parsed[0]["Farm Size"]).toBe("50 Acres");
    expect(parsed[0]["GPS Coordinates"]).toBe("5.6037° N, 0.1870° W");
  });
});
