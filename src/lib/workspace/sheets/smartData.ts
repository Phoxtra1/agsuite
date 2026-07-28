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
  Tasks: {
    id: "Tasks",
    name: "Tasks Module",
    description: "Manage and assign team tasks, sprint cycles, priority levels, status workflows, and completion dates.",
    defaultHeaders: ["Task ID", "Task Name", "Assigned To", "Priority", "Status", "Due Date", "Estimated Hours"],
    defaultData: [
      { "Task ID": "TSK-101", "Task Name": "Integrate CRM Workspace", "Assigned To": "Jules Agent", "Priority": "High", "Status": "In Progress", "Due Date": "2026-04-12", "Estimated Hours": 16 },
      { "Task ID": "TSK-102", "Task Name": "Test Real Online Meetings", "Assigned To": "Ebenezer Ocloo", "Priority": "Medium", "Status": "To Do", "Due Date": "2026-04-19", "Estimated Hours": 8 }
    ]
  },
  HR: {
    id: "HR",
    name: "HR Management",
    description: "Transform structured spreadsheet data into an intelligent Human Resource Management workspace, adapted automatically from column attributes.",
    defaultHeaders: [
      "Employee ID",
      "Employee Name",
      "Department",
      "Position",
      "Employment Type",
      "Manager",
      "Hire Date",
      "Status",
      "Office Location",
      "Base Salary"
    ],
    defaultData: [
      {
        "Employee ID": "EMP01",
        "Employee Name": "Emmanuel Quaye",
        "Department": "Engineering",
        "Position": "Senior Software Engineer",
        "Employment Type": "Full-Time",
        "Manager": "Ebenezer Ocloo",
        "Hire Date": "2023-01-15",
        "Status": "Active",
        "Office Location": "Accra HQ",
        "Base Salary": 4500
      },
      {
        "Employee ID": "EMP02",
        "Employee Name": "Grace Mensah",
        "Department": "Marketing",
        "Position": "Marketing Lead",
        "Employment Type": "Full-Time",
        "Manager": "Ebenezer Ocloo",
        "Hire Date": "2024-03-01",
        "Status": "Active",
        "Office Location": "Accra HQ",
        "Base Salary": 3500
      },
      {
        "Employee ID": "EMP03",
        "Employee Name": "Kofi Anan",
        "Department": "Engineering",
        "Position": "QA Automation Engineer",
        "Employment Type": "Contract",
        "Manager": "Emmanuel Quaye",
        "Hire Date": "2026-02-01",
        "Status": "Probation",
        "Office Location": "Remote",
        "Base Salary": 2800
      }
    ]
  },
  Registry: {
    id: "Registry",
    name: "Registry",
    description: " Centralized directory for classifying legal, financial, property, student, or asset records.",
    defaultHeaders: ["Record ID", "Name", "Category", "Type", "Status", "Location", "Created Date", "Notes"],
    defaultData: [
      { "Record ID": "REG001", "Name": "Agyenkwa Partnership Agreement", "Category": "Partners", "Type": "Legal Document", "Status": "Active", "Location": "Cabinet A-02", "Created Date": "2026-01-10", "Notes": "Partnership active" },
      { "Record ID": "REG002", "Name": "Secure Farming Tractor v2", "Category": "Assets", "Type": "Equipment", "Status": "Active", "Location": "Kumasi Hub", "Created Date": "2026-02-14", "Notes": "Inspection due next week." }
    ]
  },
  Project: {
    id: "Project",
    name: "Project Management",
    description: "Track project phases, timelines, status indicators, and budget parameters.",
    defaultHeaders: ["Project ID", "Project Name", "Manager", "Status", "Start Date", "Budget (USD)", "Progress"],
    defaultData: [
      { "Project ID": "PRJ-01", "Project Name": "Core Engine Migration", "Manager": "Emmanuel Quaye", "Status": "Active", "Start Date": "2026-01-01", "Budget (USD)": 85000, "Progress": "75%" }
    ]
  },
  Custom: {
    id: "Custom",
    name: "Custom Solution",
    description: "Generate a connected interactive workspace directly mapping any user defined fields.",
    defaultHeaders: ["ID", "Name", "Status", "Description"],
    defaultData: [
      { "ID": "REC-01", "Name": "Sample Record Name", "Status": "Active", "Description": "Dynamic Custom template parsed successfully." }
    ]
  }
};

export interface SheetAnalysis {
  hasEmployees: boolean;
  hasDepartments: boolean;
  hasPositions: boolean;
  hasAttendance: boolean;
  hasLeave: boolean;
  hasPerformance: boolean;
  hasRecruitment: boolean;
  hasOnboarding: boolean;
  hasSalary: boolean;
  hasLocation: boolean;
  hasOwner: boolean;
  hasStatus: boolean;
  hasTasks: boolean;
  hasDates: boolean;
  hasValue: boolean;

  employeeIdCol?: string;
  employeeNameCol?: string;
  departmentCol?: string;
  positionCol?: string;
  statusCol?: string;
  salaryCol?: string;
  dateCol?: string;
  locationCol?: string;
  leaveTypeCol?: string;
  attendanceStatusCol?: string;
  ratingCol?: string;
  jobTitleCol?: string;

  allColumns: string[];
  customColumns: string[];
  detectedStatuses: string[];
}

/**
 * AI Dynamic Analysis Engine: Inspects any sheet Page and returns a complete analysis profile
 */
export function analyzeSheetData(sheet: SheetPage): SheetAnalysis {
  const headers = getSheetHeaders(sheet);
  const records = parseSheetRows(sheet);

  const profile: SheetAnalysis = {
    hasEmployees: false,
    hasDepartments: false,
    hasPositions: false,
    hasAttendance: false,
    hasLeave: false,
    hasPerformance: false,
    hasRecruitment: false,
    hasOnboarding: false,
    hasSalary: false,
    hasLocation: false,
    hasOwner: false,
    hasStatus: false,
    hasTasks: false,
    hasDates: false,
    hasValue: false,
    allColumns: headers,
    customColumns: [],
    detectedStatuses: []
  };

  headers.forEach((h) => {
    const norm = h.toLowerCase().trim();

    // Map column roles
    if (norm.includes("employee id") || norm.includes("emp id")) {
      profile.hasEmployees = true;
      profile.employeeIdCol = h;
    } else if (norm.includes("employee name") || norm.includes("full name") || norm.includes("staff name") || norm.includes("member name") || norm.includes("candidate name") || norm.includes("name")) {
      profile.employeeNameCol = h;
    } else if (norm.includes("department") || norm.includes("dept")) {
      profile.hasDepartments = true;
      profile.departmentCol = h;
    } else if (norm.includes("position") || norm.includes("job title") || norm.includes("role")) {
      profile.hasPositions = true;
      profile.positionCol = h;
    } else if (norm.includes("attendance") || norm.includes("check-in") || norm.includes("check-out") || norm.includes("working hours")) {
      profile.hasAttendance = true;
      profile.attendanceStatusCol = h;
    } else if (norm.includes("leave")) {
      profile.hasLeave = true;
      profile.leaveTypeCol = h;
    } else if (norm.includes("rating") || norm.includes("performance") || norm.includes("reviewer") || norm.includes("appraisal")) {
      profile.hasPerformance = true;
      profile.ratingCol = h;
    } else if (norm.includes("application") || norm.includes("hiring status") || norm.includes("candidate")) {
      profile.hasRecruitment = true;
      profile.jobTitleCol = h;
    } else if (norm.includes("onboarding") || norm.includes("orientation") || norm.includes("equipment assigned")) {
      profile.hasOnboarding = true;
    } else if (norm.includes("salary") || norm.includes("payroll") || norm.includes("compensation") || norm.includes("wage")) {
      profile.hasSalary = true;
      profile.salaryCol = h;
    } else if (norm.includes("location") || norm.includes("office") || norm.includes("branch")) {
      profile.hasLocation = true;
      profile.locationCol = h;
    } else if (norm.includes("owner") || norm.includes("manager") || norm.includes("supervisor")) {
      profile.hasOwner = true;
    } else if (norm.includes("status") || norm.includes("workflow") || norm.includes("progress")) {
      profile.hasStatus = true;
      profile.statusCol = h;
    } else if (norm.includes("task") || norm.includes("estimated hours")) {
      profile.hasTasks = true;
    } else if (norm.includes("date") || norm.includes("time") || norm.includes("hired") || norm.includes("created") || norm.includes("due")) {
      profile.hasDates = true;
      profile.dateCol = h;
    } else if (norm.includes("value") || norm.includes("budget") || norm.includes("cost") || norm.includes("amount") || norm.includes("$")) {
      profile.hasValue = true;
    } else if (h !== "") {
      // It is a dynamic custom column!
      profile.customColumns.push(h);
    }
  });

  // Extract unique statuses
  if (profile.statusCol) {
    const statuses = new Set<string>();
    records.forEach((r) => {
      const sVal = r[profile.statusCol!];
      if (sVal) statuses.add(String(sVal));
    });
    profile.detectedStatuses = Array.from(statuses);
  }

  return profile;
}

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
    if (id === "Custom") continue;
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

  // Fallback match: if headers contain "Employee ID" or "Employee Name", recommend HR
  if (!bestMatch) {
    if (headers.some(h => h.includes("employee") || h.includes("department") || h.includes("position"))) {
      return "HR";
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
      if (!rec.status) rec.status = rec["Status"] || rec["Employment Status"] || rec["Attendance Status"] || rec["Application Status"] || "Active";

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
  let colIdx = headers.findIndex(h => h.toLowerCase() === field.toLowerCase());

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

    if (val === undefined) {
      // try case insensitive
      const foundKey = Object.keys(record).find(k => k.toLowerCase() === header.toLowerCase());
      if (foundKey) val = record[foundKey];
    }

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

/**
 * Seeding HR Management: Automatically seeds all 8 sheets in the workbook in correct order
 */
export function seedHrSolutionToWorkbook(wb: Workbook): Workbook {
  const sheets = [...wb.sheets];

  // Helper to find or create sheet by name
  function getOrCreateSheet(name: string, headers: string[], defaultData: any[]): SheetPage {
    let sheetIdx = sheets.findIndex((s) => s.name === name);
    let sheet: SheetPage;

    if (sheetIdx === -1) {
      // If first sheet is default and empty, we can rename/re-use it!
      const activeSheetObj = sheets[wb.activeSheet ?? 0] || sheets[0];
      const hasNoData = Object.keys(activeSheetObj.cells).length === 0;
      if (hasNoData && activeSheetObj.name === "Sheet1") {
        activeSheetObj.name = name;
        sheet = activeSheetObj;
      } else {
        sheet = { name, cells: {} };
        sheets.push(sheet);
      }
    } else {
      sheet = sheets[sheetIdx];
    }

    // Seed if empty
    if (Object.keys(sheet.cells).length === 0) {
      // Seed headers
      headers.forEach((header, colIdx) => {
        sheet.cells[cellId(0, colIdx)] = header;
      });
      // Seed defaultData
      defaultData.forEach((row, rowIdx) => {
        headers.forEach((header, colIdx) => {
          sheet.cells[cellId(rowIdx + 1, colIdx)] = row[header] ?? "";
        });
      });
    }

    return sheet;
  }

  // Seed default data for Employee lists only (No hardcoded sections seeded statically)
  getOrCreateSheet("Employees", SOLUTIONS_TEMPLATES.HR.defaultHeaders, SOLUTIONS_TEMPLATES.HR.defaultData);

  return {
    ...wb,
    sheets,
    activeSolution: {
      type: "HR",
      meetings: wb.activeSolution?.meetings || []
    }
  };
}

/**
 * Helper Parsers for individual HR sheets to feed the UI
 */
export function parseHrEmployees(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Employees") || wb.sheets[wb.activeSheet ?? 0] || wb.sheets[0];
  return parseSheetRows(sheet);
}

export function parseHrDepartments(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Departments");
  return sheet ? parseSheetRows(sheet) : [];
}

export function parseHrPositions(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Positions");
  return sheet ? parseSheetRows(sheet) : [];
}

export function parseHrAttendance(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Attendance");
  return sheet ? parseSheetRows(sheet) : [];
}

export function parseHrLeave(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Leave");
  return sheet ? parseSheetRows(sheet) : [];
}

export function parseHrPerformance(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Performance");
  return sheet ? parseSheetRows(sheet) : [];
}

export function parseHrRecruitment(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Recruitment");
  return sheet ? parseSheetRows(sheet) : [];
}

export function parseHrOnboarding(wb: Workbook): Record<string, any>[] {
  const sheet = wb.sheets.find(s => s.name === "Onboarding");
  return sheet ? parseSheetRows(sheet) : [];
}
