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
    name: "HR Management",
    description: "Transform structured spreadsheet data into a complete Human Resource Management workspace. Track employee directory, departments, positions, attendance, leave, performance reviews, recruitment, and onboarding checklists.",
    defaultHeaders: [
      "Employee ID",
      "First Name",
      "Last Name",
      "Full Name",
      "Preferred Name",
      "Gender",
      "Date of Birth",
      "Nationality",
      "Phone",
      "Email",
      "Address",
      "Emergency Contact",
      "Emergency Contact Number",
      "Employment Status",
      "Employment Type",
      "Hire Date",
      "End Date",
      "Department",
      "Position",
      "Manager",
      "Office Location",
      "Notes"
    ],
    defaultData: [
      {
        "Employee ID": "EMP001",
        "First Name": "Emmanuel",
        "Last Name": "Quaye",
        "Full Name": "Emmanuel Quaye",
        "Preferred Name": "Emma",
        "Gender": "Male",
        "Date of Birth": "1990-05-15",
        "Nationality": "Ghanaian",
        "Phone": "+233 551 222333",
        "Email": "e.quaye@amineva.com",
        "Address": "12 Ring Road, Accra",
        "Emergency Contact": "Theresa Quaye",
        "Emergency Contact Number": "+233 551 222334",
        "Employment Status": "Active",
        "Employment Type": "Full-Time",
        "Hire Date": "2023-01-15",
        "End Date": "",
        "Department": "Engineering",
        "Position": "Senior Software Engineer",
        "Manager": "Ebenezer Ocloo",
        "Office Location": "Accra HQ",
        "Notes": "Outstanding performance in frontend architecture."
      },
      {
        "Employee ID": "EMP002",
        "First Name": "Grace",
        "Last Name": "Mensah",
        "Full Name": "Grace Mensah",
        "Preferred Name": "Grace",
        "Gender": "Female",
        "Date of Birth": "1993-08-22",
        "Nationality": "Ghanaian",
        "Phone": "+233 540 111222",
        "Email": "g.mensah@amineva.com",
        "Address": "45 Liberation Road, Accra",
        "Emergency Contact": "John Mensah",
        "Emergency Contact Number": "+233 540 111223",
        "Employment Status": "Active",
        "Employment Type": "Full-Time",
        "Hire Date": "2024-03-01",
        "End Date": "",
        "Department": "Marketing",
        "Position": "Marketing Lead",
        "Manager": "Ebenezer Ocloo",
        "Office Location": "Accra HQ",
        "Notes": "Key lead for product rebranding campaigns."
      },
      {
        "Employee ID": "EMP003",
        "First Name": "Kofi",
        "Last Name": "Anan",
        "Full Name": "Kofi Anan",
        "Preferred Name": "Kofi",
        "Gender": "Male",
        "Date of Birth": "1995-11-02",
        "Nationality": "Ghanaian",
        "Phone": "+233 244 555666",
        "Email": "k.anan@amineva.com",
        "Address": "7 Spintex Road, Accra",
        "Emergency Contact": "Abena Anan",
        "Emergency Contact Number": "+233 244 555667",
        "Employment Status": "Probation",
        "Employment Type": "Contract",
        "Hire Date": "2026-02-01",
        "End Date": "2026-08-01",
        "Department": "Engineering",
        "Position": "QA Automation Engineer",
        "Manager": "Emmanuel Quaye",
        "Office Location": "Remote",
        "Notes": "Onboarding in progress."
      },
      {
        "Employee ID": "EMP004",
        "First Name": "Amma",
        "Last Name": "Serwaa",
        "Full Name": "Amma Serwaa",
        "Preferred Name": "Amma",
        "Gender": "Female",
        "Date of Birth": "1991-04-18",
        "Nationality": "Ghanaian",
        "Phone": "+233 207 987654",
        "Email": "serwaa@amineva.com",
        "Address": "88 Giffard Road, Cantonments",
        "Emergency Contact": "Daniel Serwaa",
        "Emergency Contact Number": "+233 207 987655",
        "Employment Status": "On Leave",
        "Employment Type": "Full-Time",
        "Hire Date": "2022-06-10",
        "End Date": "",
        "Department": "People Operations",
        "Position": "HR Officer",
        "Manager": "Ebenezer Ocloo",
        "Office Location": "Accra HQ",
        "Notes": "Currently on annual leave."
      }
    ]
  },
  Registry: {
    id: "Registry",
    name: "Registry & Records System",
    description: "A versatile registry and repository for tracking multi-category organizational assets and records.",
    defaultHeaders: [
      "Record ID",
      "Name",
      "Category",
      "Type",
      "Status",
      "Description",
      "Owner",
      "Contact Information",
      "Location",
      "Created Date",
      "Updated Date",
      "Notes"
    ],
    defaultData: [
      {
        "Record ID": "REG-001",
        "Name": "Kofi Mensah",
        "Category": "Farmers",
        "Type": "Individual",
        "Status": "Active",
        "Description": "Cocoa smallholder sponsor",
        "Owner": "Agri Extension",
        "Contact Information": "+233 244 111222",
        "Location": "Ashanti Region",
        "Created Date": "2026-01-15",
        "Updated Date": "2026-03-10",
        "Notes": "Eligible for next fertilizer subsidy batch"
      },
      {
        "Record ID": "REG-002",
        "Name": "Tractor DX-90",
        "Category": "Equipment",
        "Type": "Asset",
        "Status": "Active",
        "Description": "Heavy-duty farm tractor",
        "Owner": "Logistics Dept",
        "Contact Information": "logistics@amineva.com",
        "Location": "Greater Accra",
        "Created Date": "2026-02-10",
        "Updated Date": "2026-04-01",
        "Notes": "Scheduled review on next Monday"
      },
      {
        "Record ID": "REG-003",
        "Name": "Grace Mensah",
        "Category": "Students",
        "Type": "Individual",
        "Status": "Pending",
        "Description": "High school scholarship beneficiary",
        "Owner": "Amniva CSR",
        "Contact Information": "grace.m@school.edu",
        "Location": "Eastern Region",
        "Created Date": "2026-03-01",
        "Updated Date": "2026-03-15",
        "Notes": "Awaiting certificate upload"
      },
      {
        "Record ID": "REG-004",
        "Name": "Vanguard Warehouse",
        "Category": "Properties",
        "Type": "Infrastructure",
        "Status": "Archived",
        "Description": "Storage unit B for post-harvest cacao",
        "Owner": "Facility Manager",
        "Contact Information": "warehouse@amineva.com",
        "Location": "Western Region",
        "Created Date": "2025-11-20",
        "Updated Date": "2026-02-14",
        "Notes": "Decommissioned for FY26"
      }
    ],
    statuses: [
      "Active",
      "Inactive",
      "Pending",
      "Suspended",
      "Archived"
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
  },
  ProjectManagement: {
    id: "ProjectManagement",
    name: "Project Management System",
    description: "Manage end-to-end planning, milestones, task execution, and team assignments.",
    defaultHeaders: [
      "Project ID", "Project Name", "Description", "Project Type", "Project Owner", "Project Manager",
      "Department", "Team", "Start Date", "End Date", "Status", "Priority", "Progress (%)", "Budget", "Location", "Notes"
    ],
    defaultData: [
      {
        "Project ID": "PRJ-001",
        "Project Name": "Agyenkwa Climate Initiative",
        "Description": "Implementing localized green and agro-climate resilient agricultural practices.",
        "Project Type": "NGO Project",
        "Project Owner": "JICA",
        "Project Manager": "Emmanuel Quaye",
        "Department": "Engineering",
        "Team": "Climate Response Squad",
        "Start Date": "2026-04-01",
        "End Date": "2026-08-31",
        "Status": "Active",
        "Priority": "Critical",
        "Progress (%)": 35,
        "Budget": 250000,
        "Location": "Eastern Region",
        "Notes": "Partnering with West African Agro Services."
      },
      {
        "Project ID": "PRJ-002",
        "Project Name": "Digital Land Registry Portal",
        "Description": "Building a GIS-backed secure property and title verification engine.",
        "Project Type": "Government Project",
        "Project Owner": "Ministry of Lands",
        "Project Manager": "Grace Mensah",
        "Department": "Product",
        "Team": "Registry Builders",
        "Start Date": "2026-05-10",
        "End Date": "2026-12-15",
        "Status": "Planning",
        "Priority": "High",
        "Progress (%)": 10,
        "Budget": 450000,
        "Location": "Greater Accra",
        "Notes": "To be integrated with the Farmer Registry."
      }
    ],
    statuses: ["Planning", "Not Started", "Active", "On Hold", "Under Review", "Completed", "Cancelled"]
  },
  ProjectTasks: {
    id: "ProjectTasks",
    name: "Project Tasks Execution",
    description: "Granular tasks assigned to individuals linked back to Projects.",
    defaultHeaders: ["Task ID", "Project ID", "Task Name", "Assigned To", "Priority", "Status", "Due Date", "Estimated Hours"],
    defaultData: [
      { "Task ID": "TSK-001", "Project ID": "PRJ-001", "Task Name": "Contact Partners", "Assigned To": "Emmanuel Quaye", "Priority": "High", "Status": "Completed", "Due Date": "2026-04-10", "Estimated Hours": 8 },
      { "Task ID": "TSK-002", "Project ID": "PRJ-001", "Task Name": "Prepare Proposal", "Assigned To": "Grace Mensah", "Priority": "Critical", "Status": "In Progress", "Due Date": "2026-04-20", "Estimated Hours": 16 },
      { "Task ID": "TSK-003", "Project ID": "PRJ-001", "Task Name": "Conduct Field Survey", "Assigned To": "Emmanuel Quaye", "Priority": "High", "Status": "To Do", "Due Date": "2026-05-15", "Estimated Hours": 24 },
      { "Task ID": "TSK-004", "Project ID": "PRJ-001", "Task Name": "Submit Report", "Assigned To": "Emmanuel Quaye", "Priority": "Medium", "Status": "To Do", "Due Date": "2026-05-30", "Estimated Hours": 12 },
      { "Task ID": "TSK-005", "Project ID": "PRJ-002", "Task Name": "Database Schema Setup", "Assigned To": "Grace Mensah", "Priority": "High", "Status": "In Progress", "Due Date": "2026-05-20", "Estimated Hours": 10 }
    ]
  },
  ProjectMilestones: {
    id: "ProjectMilestones",
    name: "Project Milestones",
    description: "Key milestones of progress indicating major project stages.",
    defaultHeaders: ["Milestone ID", "Project ID", "Milestone Name", "Description", "Due Date", "Status", "Completion Percentage"],
    defaultData: [
      { "Milestone ID": "MS-001", "Project ID": "PRJ-001", "Milestone Name": "Phase 1 Complete", "Description": "Partner mobilization and initialization parameters established.", "Due Date": "2026-04-25", "Status": "In Progress", "Completion Percentage": 60 },
      { "Milestone ID": "MS-002", "Project ID": "PRJ-001", "Milestone Name": "Research Completed", "Description": "All agricultural field data parsed and evaluated.", "Due Date": "2026-06-30", "Status": "Not Started", "Completion Percentage": 0 },
      { "Milestone ID": "MS-003", "Project ID": "PRJ-001", "Milestone Name": "Launch Completed", "Description": "Full deployment of clean climate mechanisms across sites.", "Due Date": "2026-08-15", "Status": "Not Started", "Completion Percentage": 0 },
      { "Milestone ID": "MS-004", "Project ID": "PRJ-002", "Milestone Name": "MVP Prototype Launch", "Description": "First public functional system live demo.", "Due Date": "2026-07-01", "Status": "In Progress", "Completion Percentage": 20 }
    ]
  },
  ProjectTeams: {
    id: "ProjectTeams",
    name: "Project Teams Directory",
    description: "Project teams mapping list of team names and corporate divisions.",
    defaultHeaders: ["Team ID", "Team Name", "Manager", "Department", "Members"],
    defaultData: [
      { "Team ID": "TM-01", "Team Name": "Climate Response Squad", "Manager": "Emmanuel Quaye", "Department": "Engineering", "Members": "e.quaye@amineva.com, g.mensah@amineva.com" },
      { "Team ID": "TM-02", "Team Name": "Registry Builders", "Manager": "Grace Mensah", "Department": "Product", "Members": "g.mensah@amineva.com" }
    ]
  }
};

export const HR_SUPPLEMENTARY_TEMPLATES: Record<string, { headers: string[]; data: any[] }> = {
  Employees: {
    headers: SOLUTIONS_TEMPLATES.HR.defaultHeaders,
    data: SOLUTIONS_TEMPLATES.HR.defaultData
  },
  Departments: {
    headers: ["Department Name", "Department Code", "Manager", "Description"],
    data: [
      { "Department Name": "Engineering", "Department Code": "ENG", "Manager": "Ebenezer Ocloo", "Description": "Technology development and systems engineering." },
      { "Department Name": "Marketing", "Department Code": "MKT", "Manager": "Grace Mensah", "Description": "Growth, brand positioning, and campaigns." },
      { "Department Name": "People Operations", "Department Code": "HR", "Manager": "Amma Serwaa", "Description": "HR development, onboarding, and operations." }
    ]
  },
  Positions: {
    headers: ["Position Title", "Department", "Reports To", "Description"],
    data: [
      { "Position Title": "Senior Software Engineer", "Department": "Engineering", "Reports To": "Engineering Lead", "Description": "Designs and maintains software systems." },
      { "Position Title": "QA Automation Engineer", "Department": "Engineering", "Reports To": "Senior Software Engineer", "Description": "Automates testing suites and pipelines." },
      { "Position Title": "Marketing Lead", "Department": "Marketing", "Reports To": "Ebenezer Ocloo", "Description": "Directs regional marketing campaigns." },
      { "Position Title": "HR Officer", "Department": "People Operations", "Reports To": "Ebenezer Ocloo", "Description": "Coordinates employee relations and operations." }
    ]
  },
  Attendance: {
    headers: ["Employee ID", "Employee Name", "Date", "Check-In Time", "Check-Out Time", "Working Hours", "Attendance Status", "Attendance Notes"],
    data: [
      { "Employee ID": "EMP001", "Employee Name": "Emmanuel Quaye", "Date": "2026-04-10", "Check-In Time": "08:55 AM", "Check-Out Time": "05:05 PM", "Working Hours": 8.1, "Attendance Status": "Present", "Attendance Notes": "On time." },
      { "Employee ID": "EMP002", "Employee Name": "Grace Mensah", "Date": "2026-04-10", "Check-In Time": "09:15 AM", "Check-Out Time": "05:00 PM", "Working Hours": 7.7, "Attendance Status": "Late", "Attendance Notes": "Heavy morning traffic." },
      { "Employee ID": "EMP003", "Employee Name": "Kofi Anan", "Date": "2026-04-10", "Check-In Time": "09:00 AM", "Check-Out Time": "05:00 PM", "Working Hours": 8.0, "Attendance Status": "Remote", "Attendance Notes": "Work from home today." },
      { "Employee ID": "EMP004", "Employee Name": "Amma Serwaa", "Date": "2026-04-10", "Check-In Time": "", "Check-Out Time": "", "Working Hours": 0.0, "Attendance Status": "Leave", "Attendance Notes": "Approved annual leave." }
    ]
  },
  Leave: {
    headers: ["Employee ID", "Employee Name", "Leave Type", "Start Date", "End Date", "Total Days", "Status", "Approver", "Notes"],
    data: [
      { "Employee ID": "EMP004", "Employee Name": "Amma Serwaa", "Leave Type": "Annual Leave", "Start Date": "2026-04-05", "End Date": "2026-04-12", "Total Days": 7, "Status": "Approved", "Approver": "Ebenezer Ocloo", "Notes": "Annual vacation." },
      { "Employee ID": "EMP002", "Employee Name": "Grace Mensah", "Leave Type": "Sick Leave", "Start Date": "2026-03-10", "End Date": "2026-03-11", "Total Days": 1, "Status": "Approved", "Approver": "Ebenezer Ocloo", "Notes": "Medical appointment." },
      { "Employee ID": "EMP001", "Employee Name": "Emmanuel Quaye", "Leave Type": "Study Leave", "Start Date": "2026-05-01", "End Date": "2026-05-05", "Total Days": 4, "Status": "Pending", "Approver": "Amma Serwaa", "Notes": "Tech conference and research." }
    ]
  },
  Performance: {
    headers: ["Employee ID", "Employee Name", "Review Date", "Reviewer", "Rating", "Goals", "Comments"],
    data: [
      { "Employee ID": "EMP001", "Employee Name": "Emmanuel Quaye", "Review Date": "2026-03-15", "Reviewer": "Ebenezer Ocloo", "Rating": 5, "Goals": "Complete system migration", "Comments": "Exemplary technical leadership." },
      { "Employee ID": "EMP002", "Employee Name": "Grace Mensah", "Review Date": "2026-03-18", "Reviewer": "Ebenezer Ocloo", "Rating": 4, "Goals": "Expand branding footprint", "Comments": "Excellent alignment and engagement." }
    ]
  },
  Recruitment: {
    headers: ["Job Title", "Department", "Candidate Name", "Application Status", "Interview Date", "Hiring Status"],
    data: [
      { "Job Title": "Front-End Engineer", "Department": "Engineering", "Candidate Name": "Kwabena Boateng", "Application Status": "Interview Scheduled", "Interview Date": "2026-04-20", "Hiring Status": "Under Review" },
      { "Job Title": "HR Coordinator", "Department": "People Operations", "Candidate Name": "Esi Mensah", "Application Status": "Applied", "Interview Date": "", "Hiring Status": "Under Review" },
      { "Job Title": "Product Designer", "Department": "Product", "Candidate Name": "Kweku Appiah", "Application Status": "Offer Sent", "Interview Date": "2026-03-25", "Hiring Status": "Offered" }
    ]
  },
  Onboarding: {
    headers: ["Employee ID", "Employee Name", "Documents Submitted", "Orientation Completed", "Equipment Assigned", "Account Created", "Training Completed"],
    data: [
      { "Employee ID": "EMP003", "Employee Name": "Kofi Anan", "Documents Submitted": "Yes", "Orientation Completed": "Yes", "Equipment Assigned": "Yes", "Account Created": "Yes", "Training Completed": "No" },
      { "Employee ID": "EMP001", "Employee Name": "Emmanuel Quaye", "Documents Submitted": "Yes", "Orientation Completed": "Yes", "Equipment Assigned": "Yes", "Account Created": "Yes", "Training Completed": "Yes" },
      { "Employee ID": "EMP002", "Employee Name": "Grace Mensah", "Documents Submitted": "Yes", "Orientation Completed": "Yes", "Equipment Assigned": "Yes", "Account Created": "Yes", "Training Completed": "Yes" }
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
 * Intelligent analyzer that scans a sheet's headers and column profiles to formulate
 * a dynamic custom solution config based entirely on their actual columns.
 */
export function analyzeSheetDataForCustomSolution(sheet: SheetPage) {
  const headers = getSheetHeaders(sheet).filter(Boolean);
  const profiles = profileColumns(sheet);

  // If no columns are found, return a default blank starter template framework
  if (headers.length === 0) {
    return {
      solutionName: "My Connected Workspace",
      solutionType: "operations",
      headers: ["ID", "Title", "Status", "Date Created"],
      forms: ["ID", "Title", "Status", "Date Created"],
      metrics: [
        { label: "Total Rows", formula: "COUNT", column: "ID" }
      ],
      charts: [
        { title: "Status Breakdown", type: "pie", xKey: "Status", yKey: "ID" }
      ],
      automations: [
        { trigger: "On Status Change", action: "Notify Workspace Team", enabled: true }
      ],
      statusCol: "Status",
      dateCol: "Date Created",
      primaryCol: "Title"
    };
  }

  // Find status column
  const statusProfile = profiles.find(p => p.type === "status") ||
    profiles.find(p => ["status", "stage", "state", "classification", "phase"].some(k => p.header.toLowerCase().includes(k)));
  const statusCol = statusProfile ? statusProfile.header : headers[Math.min(2, headers.length - 1)];

  // Find date column
  const dateProfile = profiles.find(p => p.type === "date") ||
    profiles.find(p => ["date", "time", "schedule", "deadline", "due", "period"].some(k => p.header.toLowerCase().includes(k)));
  const dateCol = dateProfile ? dateProfile.header : undefined;

  // Find numeric/currency columns
  const numericProfiles = profiles.filter(p => p.type === "number" || p.type === "currency" || ["amount", "value", "cost", "salary", "price"].some(k => p.header.toLowerCase().includes(k)));
  const currencyCol = profiles.find(p => p.type === "currency")?.header;

  // Primary label column
  const primaryCol = headers[1] || headers[0];

  // Infer Solution Type from headers keywords
  let solutionType = "operations";
  let solutionName = "My Business Operations Suite";
  const headerKeys = headers.map(h => h.toLowerCase());

  if (headerKeys.some(h => ["account", "expense", "income", "revenue", "ledger", "tax"].some(k => h.includes(k)))) {
    solutionType = "accounting";
    solutionName = "Data-Driven Ledger System";
  } else if (headerKeys.some(h => ["audit", "finding", "checklist", "recommendation"].some(k => h.includes(k)))) {
    solutionType = "audit";
    solutionName = "Dynamic Audit & Findings Registry";
  } else if (headerKeys.some(h => ["compliance", "regulation", "policy", "requirement"].some(k => h.includes(k)))) {
    solutionType = "compliance";
    solutionName = "Intelligent Compliance Manager";
  } else if (headerKeys.some(h => ["member", "subscription", "fee", "join"].some(k => h.includes(k)))) {
    solutionType = "operations";
    solutionName = "Membership Management Suite";
  } else if (headerKeys.some(h => ["asset", "hardware", "device", "inventory"].some(k => h.includes(k)))) {
    solutionType = "operations";
    solutionName = "Asset & Inventory Directory";
  }

  // Generate dynamic, data-driven KPI Metrics
  const metrics: any[] = [];
  if (numericProfiles.length > 0) {
    const numCol = numericProfiles[0].header;
    metrics.push({
      label: `Total ${numCol}`,
      formula: "SUM",
      column: numCol,
      prefix: currencyCol || numCol.toLowerCase().includes("cost") || numCol.toLowerCase().includes("value") || numCol.toLowerCase().includes("amount") ? "$" : ""
    });
    metrics.push({
      label: `Average ${numCol}`,
      formula: "AVG",
      column: numCol,
      prefix: currencyCol || numCol.toLowerCase().includes("cost") || numCol.toLowerCase().includes("value") || numCol.toLowerCase().includes("amount") ? "$" : ""
    });
  }
  metrics.push({
    label: `Total Registered Records`,
    formula: "COUNT",
    column: headers[0]
  });

  // Generate dynamic Charts
  const charts: any[] = [];
  if (statusCol) {
    charts.push({
      title: `${statusCol} Distribution`,
      type: "pie",
      xKey: statusCol,
      yKey: numericProfiles[0]?.header || headers[0]
    });
  }
  if (numericProfiles.length > 0 && primaryCol) {
    charts.push({
      title: `${numericProfiles[0].header} by ${primaryCol}`,
      type: "bar",
      xKey: primaryCol,
      yKey: numericProfiles[0].header
    });
  }

  // Automations
  const automations = [
    { trigger: `On Status updates for ${statusCol}`, action: "Log Audit Trail Activity", enabled: true }
  ];
  if (dateCol) {
    automations.push({ trigger: `3 Days Before ${dateCol}`, action: "Trigger Alert Notification", enabled: true });
  }

  return {
    solutionName,
    solutionType,
    headers,
    forms: [...headers],
    metrics,
    charts,
    automations,
    statusCol,
    dateCol,
    primaryCol: primaryCol || headers[0]
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

  // Generate all 8 sheets
  getOrCreateSheet("Employees", HR_SUPPLEMENTARY_TEMPLATES.Employees.headers, HR_SUPPLEMENTARY_TEMPLATES.Employees.data);
  getOrCreateSheet("Departments", HR_SUPPLEMENTARY_TEMPLATES.Departments.headers, HR_SUPPLEMENTARY_TEMPLATES.Departments.data);
  getOrCreateSheet("Positions", HR_SUPPLEMENTARY_TEMPLATES.Positions.headers, HR_SUPPLEMENTARY_TEMPLATES.Positions.data);
  getOrCreateSheet("Attendance", HR_SUPPLEMENTARY_TEMPLATES.Attendance.headers, HR_SUPPLEMENTARY_TEMPLATES.Attendance.data);
  getOrCreateSheet("Leave", HR_SUPPLEMENTARY_TEMPLATES.Leave.headers, HR_SUPPLEMENTARY_TEMPLATES.Leave.data);
  getOrCreateSheet("Performance", HR_SUPPLEMENTARY_TEMPLATES.Performance.headers, HR_SUPPLEMENTARY_TEMPLATES.Performance.data);
  getOrCreateSheet("Recruitment", HR_SUPPLEMENTARY_TEMPLATES.Recruitment.headers, HR_SUPPLEMENTARY_TEMPLATES.Recruitment.data);
  getOrCreateSheet("Onboarding", HR_SUPPLEMENTARY_TEMPLATES.Onboarding.headers, HR_SUPPLEMENTARY_TEMPLATES.Onboarding.data);

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
