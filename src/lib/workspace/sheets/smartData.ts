import { type SheetPage, type Workbook, cellId, colToLetter, parseCell } from "./documents";

export type ColumnType = "text" | "number" | "currency" | "email" | "phone" | "date" | "status" | "company";

export interface ColumnProfile {
  colIdx: number;
  colLetter: string;
  header: string;
  type: ColumnType;
}

export interface BusinessSolutionTemplate {
  id: string;
  name: string;
  description: string;
  defaultHeaders: string[];
  defaultData: Record<string, string | number>[];
  statuses?: string[];
}

export const SOLUTIONS_TEMPLATES: Record<string, BusinessSolutionTemplate> = {
  Tasks: {
    id: "Tasks",
    name: "Tasks & Project Management",
    description: "Track team tasks, deadlines, statuses, and categories with integrated collaboration tools.",
    defaultHeaders: [
      "Task ID",
      "Task Name",
      "Description",
      "Category",
      "Assigned To",
      "Assigned By",
      "Department",
      "Team",
      "Priority",
      "Status",
      "Start Date",
      "Due Date",
      "Completion Date",
      "Estimated Duration",
      "Actual Duration",
      "Progress (%)",
      "Tags",
      "Notes"
    ],
    defaultData: [
      {
        "Task ID": "TSK-001",
        "Task Name": "Prepare Partnership Proposal",
        "Description": "Create the draft funding proposal for JICA and share with the team.",
        "Category": "Projects",
        "Assigned To": "Jules Agent",
        "Assigned By": "Ebenezer Ocloo",
        "Department": "Projects",
        "Team": "Development Team",
        "Priority": "Critical",
        "Status": "In Progress",
        "Start Date": "2026-04-10",
        "Due Date": "2026-04-16",
        "Completion Date": "",
        "Estimated Duration": 16,
        "Actual Duration": 8,
        "Progress (%)": 50,
        "Tags": "proposal,funding,jica",
        "Notes": "Linked with JICA CRM Record. Highly critical for funding."
      },
      {
        "Task ID": "TSK-002",
        "Task Name": "Q1 Financial Audit Support",
        "Description": "Compile financial records and receipts for the external audit team.",
        "Category": "Finance",
        "Assigned To": "Ebenezer Ocloo",
        "Assigned By": "Kofi Mensah",
        "Department": "Finance",
        "Team": "Operations",
        "Priority": "High",
        "Status": "Planned",
        "Start Date": "2026-04-12",
        "Due Date": "2026-04-20",
        "Completion Date": "",
        "Estimated Duration": 24,
        "Actual Duration": 0,
        "Progress (%)": 0,
        "Tags": "audit,finance",
        "Notes": "Needs approval from Finance head."
      },
      {
        "Task ID": "TSK-003",
        "Task Name": "Design Brand Guidelines Update",
        "Description": "Revise and update brand assets, typography, and color palettes.",
        "Category": "Marketing",
        "Assigned To": "Ama Serwaa",
        "Assigned By": "Ebenezer Ocloo",
        "Department": "Marketing",
        "Team": "Creative",
        "Priority": "Medium",
        "Status": "Not Started",
        "Start Date": "2026-04-15",
        "Due Date": "2026-04-25",
        "Completion Date": "",
        "Estimated Duration": 12,
        "Actual Duration": 0,
        "Progress (%)": 0,
        "Tags": "branding,assets",
        "Notes": ""
      },
      {
        "Task ID": "TSK-004",
        "Task Name": "Launch Employee Self-Service Portal",
        "Description": "Deploy and test the online portal for leave requests and payslips.",
        "Category": "Human Resources",
        "Assigned To": "Grace Mensah",
        "Assigned By": "Ebenezer Ocloo",
        "Department": "Human Resources",
        "Team": "HR",
        "Priority": "High",
        "Status": "Under Review",
        "Start Date": "2026-04-05",
        "Due Date": "2026-04-14",
        "Completion Date": "",
        "Estimated Duration": 40,
        "Actual Duration": 38,
        "Progress (%)": 90,
        "Tags": "hr,portal",
        "Notes": "Awaiting final review from Ebenezer."
      },
      {
        "Task ID": "TSK-005",
        "Task Name": "Configure IT Server Security Patch",
        "Description": "Apply critical system patches to production servers.",
        "Category": "IT",
        "Assigned To": "Emmanuel Quaye",
        "Assigned By": "Ebenezer Ocloo",
        "Department": "IT",
        "Team": "Infrastructure",
        "Priority": "Critical",
        "Status": "Completed",
        "Start Date": "2026-04-01",
        "Due Date": "2026-04-05",
        "Completion Date": "2026-04-04",
        "Estimated Duration": 6,
        "Actual Duration": 5,
        "Progress (%)": 100,
        "Tags": "security,server",
        "Notes": "Successfully deployed and tested."
      }
    ],
    statuses: [
      "Not Started",
      "Planned",
      "In Progress",
      "Waiting",
      "Blocked",
      "Under Review",
      "Completed",
      "Cancelled"
    ]
  },
  CRM: {
    id: "CRM",
    name: "CRM (Customer Relationship Management)",
    description: "Manage your business prospects, organizations, contacts, activities, and sales/partnership pipeline.",
    defaultHeaders: [
      "Organization",
      "Contact Person",
      "Email",
      "Phone",
      "Status",
      "Follow-up Date",
      "Value (USD)",
      "Sector",
      "Region"
    ],
    defaultData: [
      {
        "Organization": "Japan International Cooperation Agency",
        "Contact Person": "Programme Officer",
        "Email": "info@jica.go.jp",
        "Phone": "+233 302 760781",
        "Status": "Meeting Scheduled",
        "Follow-up Date": "2026-04-15",
        "Value (USD)": 150000,
        "Sector": "International Development",
        "Region": "Greater Accra"
      },
      {
        "Organization": "Agyenkwa Trust Bank",
        "Contact Person": "Kofi Mensah",
        "Email": "k.mensah@agyenkwatrust.com",
        "Phone": "+233 244 123456",
        "Status": "Proposal Sent",
        "Follow-up Date": "2026-04-18",
        "Value (USD)": 45000,
        "Sector": "Financial Services",
        "Region": "Ashanti"
      },
      {
        "Organization": "West African Agro Services",
        "Contact Person": "Ama Serwaa",
        "Email": "serwaa@waagro.org",
        "Phone": "+233 207 987654",
        "Status": "Contacted",
        "Follow-up Date": "2026-04-20",
        "Value (USD)": 25000,
        "Sector": "Agriculture",
        "Region": "Eastern"
      },
      {
        "Organization": "Ohene Minerals Group",
        "Contact Person": "Kwame Osei",
        "Email": "osei@oheneminerals.com",
        "Phone": "+233 243 000111",
        "Status": "Yet to Contact",
        "Follow-up Date": "2026-04-25",
        "Value (USD)": 300000,
        "Sector": "Mining & Resources",
        "Region": "Western"
      },
      {
        "Organization": "Amineva Technologies Ltd",
        "Contact Person": "Ebenezer Ocloo",
        "Email": "contact@amineva.com",
        "Phone": "+233 302 111222",
        "Status": "Partnership Active",
        "Follow-up Date": "2026-05-01",
        "Value (USD)": 85000,
        "Sector": "Technology",
        "Region": "Greater Accra"
      }
    ],
    statuses: [
      "Yet to Contact",
      "Contacted",
      "Follow-up Required",
      "Meeting Scheduled",
      "Proposal Sent",
      "Negotiation",
      "Partnership Active",
      "Closed"
    ]
  },
  Inventory: {
    id: "Inventory",
    name: "Inventory Management",
    description: "Track your products, stock levels, sales prices, supplier names, and reorder alerts.",
    defaultHeaders: ["Product ID", "Product Name", "Quantity", "Unit Cost", "Retail Price", "Supplier", "Stock Alert Level"],
    defaultData: [
      { "Product ID": "PROD001", "Product Name": "Amineva Smart Server v1", "Quantity": 15, "Unit Cost": 1200, "Retail Price": 2000, "Supplier": "Amineva Hardware Labs", "Stock Alert Level": 5 },
      { "Product ID": "PROD002", "Product Name": "High-Speed Fibre Transceiver", "Quantity": 3, "Unit Cost": 150, "Retail Price": 250, "Supplier": "OpticsConnect Ltd", "Stock Alert Level": 10 },
      { "Product ID": "PROD003", "Product Name": "Ohene Gold bullion bars (10g)", "Quantity": 8, "Unit Cost": 650, "Retail Price": 750, "Supplier": "Ohene Minerals Group", "Stock Alert Level": 2 }
    ]
  },
  HR: {
    id: "HR",
    name: "HR & Employee Management",
    description: "Organize employee profiles, departments, base salary, hiring date, and attendance records.",
    defaultHeaders: ["Employee ID", "Full Name", "Department", "Email", "Phone", "Base Salary", "Hiring Date"],
    defaultData: [
      { "Employee ID": "EMP01", "Full Name": "Emmanuel Quaye", "Department": "Engineering", "Email": "e.quaye@amineva.com", "Phone": "+233 551 222333", "Base Salary": 4500, "Hiring Date": "2023-01-15" },
      { "Employee ID": "EMP02", "Full Name": "Grace Mensah", "Department": "Marketing", "Email": "g.mensah@amineva.com", "Phone": "+233 540 111222", "Base Salary": 3500, "Hiring Date": "2024-03-01" }
    ]
  },
  Registry: {
    id: "Registry",
    name: "Registry & Records System",
    description: "A centralized directory for categorizing legal, financial, or operational documents and files.",
    defaultHeaders: ["Record ID", "Title", "Category", "Filing Location", "Owner", "Filing Date", "Status"],
    defaultData: [
      { "Record ID": "REG2026-001", "Title": "Agyenkwa Partnership Agreement", "Category": "Legal", "Filing Location": "Cabinet A-02", "Owner": "Legal Affairs", "Filing Date": "2026-01-10", "Status": "Active" },
      { "Record ID": "REG2026-002", "Title": "FY25 Q4 Financial Audit", "Category": "Finance", "Filing Location": "Secure Vault B", "Owner": "Audit & Risk", "Filing Date": "2026-02-14", "Status": "Archived" }
    ]
  },
  Project: {
    id: "Project",
    name: "Project & Task Management",
    description: "Coordinate your team's software sprints, tasks, completion status, due dates, and owners.",
    defaultHeaders: ["Task ID", "Task Name", "Assigned To", "Priority", "Status", "Due Date", "Estimated Hours"],
    defaultData: [
      { "Task ID": "TSK-101", "Task Name": "Integrate CRM Workspace", "Assigned To": "Jules Agent", "Priority": "High", "Status": "In Progress", "Due Date": "2026-04-12", "Estimated Hours": 16 },
      { "Task ID": "TSK-102", "Task Name": "Test Real Online Meetings", "Assigned To": "Ebenezer Ocloo", "Priority": "Medium", "Status": "To Do", "Due Date": "2026-04-19", "Estimated Hours": 8 }
    ]
  }
};

/**
 * Smart Data Layer: Profiles columns of a sheet based on their headers
 */
export function profileColumns(sheet: SheetPage): ColumnProfile[] {
  const headers = getSheetHeaders(sheet);
  return headers.map((header, idx) => {
    const colLetter = colToLetter(idx);
    let type: ColumnType = "text";

    const normalized = header.toLowerCase().trim();
    if (normalized.includes("email")) {
      type = "email";
    } else if (normalized.includes("phone") || normalized.includes("tel") || normalized.includes("mobile")) {
      type = "phone";
    } else if (normalized.includes("date") || normalized.includes("time") || normalized.includes("schedule")) {
      type = "date";
    } else if (normalized.includes("status") || normalized.includes("pipeline") || normalized.includes("workflow")) {
      type = "status";
    } else if (normalized.includes("organization") || normalized.includes("company") || normalized.includes("partner") || normalized.includes("client")) {
      type = "company";
    } else if (normalized.includes("amount") || normalized.includes("usd") || normalized.includes("price") || normalized.includes("salary") || normalized.includes("cost") || normalized.includes("value") || normalized.includes("$")) {
      type = "currency";
    } else if (normalized.includes("quantity") || normalized.includes("count") || normalized.includes("total") || normalized.includes("hours") || normalized.includes("num") || normalized.includes("id")) {
      type = "number";
    }

    return {
      colIdx: idx,
      colLetter,
      header,
      type
    };
  });
}

/**
 * Get sheet headers from Row 1
 */
export function getSheetHeaders(sheet: SheetPage): string[] {
  const headers: string[] = [];
  let col = 0;
  while (true) {
    const cid = cellId(0, col);
    const val = sheet.cells[cid];
    if (val === undefined || val === null || val === "") {
      // Look ahead up to 5 empty columns to handle empty pockets
      let foundMore = false;
      for (let look = 1; look <= 5; look++) {
        if (sheet.cells[cellId(0, col + look)]) {
          foundMore = true;
          break;
        }
      }
      if (!foundMore) break;
      headers.push("");
    } else {
      headers.push(String(val));
    }
    col++;
  }
  return headers;
}

/**
 * Recommends a business solution based on current sheet columns
 */
export function recommendSolution(sheet: SheetPage): string | null {
  const headers = getSheetHeaders(sheet).map(h => h.toLowerCase().trim());
  if (headers.length === 0) return null;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [id, template] of Object.entries(SOLUTIONS_TEMPLATES)) {
    let score = 0;
    for (const h of template.defaultHeaders) {
      if (headers.some(header => header.includes(h.toLowerCase()) || h.toLowerCase().includes(header))) {
        score++;
      }
    }
    const matchRatio = score / template.defaultHeaders.length;
    if (matchRatio >= 0.3 && score > bestScore) {
      bestScore = score;
      bestMatch = id;
    }
  }

  return bestMatch;
}

/**
 * Initialize / Seed a sheet with a Solution template
 */
export function seedSolutionToSheet(sheet: SheetPage, templateId: string): SheetPage {
  const template = SOLUTIONS_TEMPLATES[templateId];
  if (!template) return sheet;

  const cells = { ...sheet.cells };

  // Write headers to Row 1
  template.defaultHeaders.forEach((header, colIdx) => {
    cells[cellId(0, colIdx)] = header;
  });

  // Write default rows
  template.defaultData.forEach((row, rowIdx) => {
    template.defaultHeaders.forEach((header, colIdx) => {
      cells[cellId(rowIdx + 1, colIdx)] = row[header] ?? "";
    });
  });

  return {
    ...sheet,
    cells
  };
}

/**
 * Parse rows into structured, strongly typed records
 */
export function parseSheetRows(sheet: SheetPage): Record<string, any>[] {
  const headers = getSheetHeaders(sheet);
  if (headers.length === 0) return [];

  const records: Record<string, any>[] = [];
  const profiles = profileColumns(sheet);

  // Read all rows until we hit consecutive empty rows
  let row = 1;
  let emptyRowsCount = 0;

  while (emptyRowsCount < 10) {
    let rowHasData = false;
    const rec: Record<string, any> = {
      rowIndex: row,
      _originalCells: {} as Record<string, any>
    };

    headers.forEach((header, colIdx) => {
      const cid = cellId(row, colIdx);
      const val = sheet.cells[cid];
      if (val !== undefined && val !== null && val !== "") {
        rowHasData = true;
      }
      rec[header] = val ?? "";
      rec._originalCells[header] = { cid, val };
    });

    if (rowHasData) {
      // Find standard fields using profile column types
      profiles.forEach(p => {
        const val = rec[p.header];
        if (p.type === "company") rec.organizationName = val;
        if (p.type === "text" && p.header.toLowerCase().includes("person")) rec.contactName = val;
        if (p.type === "email") rec.email = val;
        if (p.type === "phone") rec.phone = val;
        if (p.type === "status") rec.status = val;
        if (p.type === "date") rec.date = val;
        if (p.type === "currency") rec.value = Number(val) || 0;
      });

      // Fallbacks if profile mapping didn't find them explicitly
      if (!rec.organizationName) rec.organizationName = rec[headers[0]] || "";
      if (!rec.contactName) rec.contactName = rec[headers[1]] || rec.contactName || "";
      if (!rec.email) rec.email = rec[headers[2]] || "";
      if (!rec.status) rec.status = rec["Status"] || "Yet to Contact";

      records.push(rec);
      emptyRowsCount = 0;
    } else {
      emptyRowsCount++;
    }
    row++;
  }

  return records;
}

/**
 * 2-Way Sync: Update specific record back into the Sheet Cells
 */
export function updateSheetRecord(
  sheet: SheetPage,
  rowIndex: number,
  field: string,
  value: any
): SheetPage {
  const cells = { ...sheet.cells };
  const headers = getSheetHeaders(sheet);
  const profiles = profileColumns(sheet);

  // Try to find the exact column by matching the header name directly
  let colIdx = headers.findIndex(h => h === field);

  // If not found directly, find by profile types (e.g. if field = 'status', find column profiled as 'status')
  if (colIdx === -1) {
    const profile = profiles.find(p => {
      if (field === "organizationName" && p.type === "company") return true;
      if (field === "contactName" && p.header.toLowerCase().includes("person")) return true;
      if (field === "email" && p.type === "email") return true;
      if (field === "phone" && p.type === "phone") return true;
      if (field === "status" && p.type === "status") return true;
      if (field === "date" && p.type === "date") return true;
      return false;
    });
    if (profile) colIdx = profile.colIdx;
  }

  // Fallback: If still not found and fields map to common spreadsheet headers
  if (colIdx === -1) {
    if (field === "organizationName") colIdx = 0;
    else if (field === "contactName") colIdx = 1;
    else if (field === "email") colIdx = 2;
    else if (field === "phone") colIdx = 3;
    else if (field === "status") colIdx = 4;
    else if (field === "date") colIdx = 5;
  }

  if (colIdx !== -1) {
    const cid = cellId(rowIndex, colIdx);
    cells[cid] = value;
  }

  return {
    ...sheet,
    cells
  };
}

/**
 * Add a new record to the sheet cells at the end of the sheet
 */
export function addSheetRecord(sheet: SheetPage, record: Record<string, any>): SheetPage {
  const headers = getSheetHeaders(sheet);
  const records = parseSheetRows(sheet);
  const nextRowIndex = records.length > 0 ? Math.max(...records.map(r => r.rowIndex)) + 1 : 1;

  const cells = { ...sheet.cells };

  headers.forEach((header, colIdx) => {
    const cid = cellId(nextRowIndex, colIdx);
    // Find matching key in record
    let val = record[header];

    // Profile type check if header key is missing
    if (val === undefined) {
      const profiles = profileColumns(sheet);
      const p = profiles.find(pr => pr.colIdx === colIdx);
      if (p) {
        if (p.type === "company") val = record.organizationName;
        else if (p.type === "text" && p.header.toLowerCase().includes("person")) val = record.contactName;
        else if (p.type === "email") val = record.email;
        else if (p.type === "phone") val = record.phone;
        else if (p.type === "status") val = record.status;
        else if (p.type === "date") val = record.date;
      }
    }

    cells[cid] = val !== undefined ? val : "";
  });

  return {
    ...sheet,
    cells
  };
}
