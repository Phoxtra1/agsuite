export interface FormTheme {
  primary: string;
  background: string;
  font: string;
  borderRadius: string; // "sm" | "md" | "lg" | "xl" | "full"
  buttonStyle: string;  // "solid" | "outline" | "pill" | "sharp"
  logoUrl?: string;
  headerImageUrl?: string;
  darkMode: boolean;
  customBranding?: string;
}

export interface FormSettings {
  collectEmail: boolean;
  anonymous: boolean;
  requireLogin: boolean;
  oneResponsePerUser: boolean;
  multipleResponses: boolean;
  responseLimit?: number;
  startDate?: string;
  endDate?: string;
  confirmationMessage: string;
  redirectUrl?: string;
  autoSaveProgress: boolean;
  language: string;
  timeZone: string;
}

export interface QuizSettings {
  enabled: boolean;
  passingScore: number; // percentage, e.g. 70
  randomQuestions: boolean;
  questionPool?: number;
  shuffleQuestions: boolean;
  timer?: number; // duration in minutes
  certificates: boolean;
}

export interface QuestionValidation {
  regex?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  fileTypes?: string[];
  maxFileSize?: number; // in MB
}

export interface ConditionalLogic {
  enabled: boolean;
  dependsOnQuestionId?: string;
  dependsOnOption?: string; // option value or index
  action: "show" | "hide" | "jump_to_section" | "jump_to_page" | "skip_to_end";
  actionTarget?: string; // section or page id or "end"
}

export interface Question {
  id: string;
  type:
    | "short_answer"
    | "long_answer"
    | "email"
    | "phone"
    | "url"
    | "number"
    | "currency"
    | "date"
    | "time"
    | "multiple_choice"
    | "checkboxes"
    | "dropdown"
    | "rating_star"
    | "rating_emoji"
    | "linear_scale"
    | "slider"
    | "yes_no"
    | "file_upload"
    | "image_upload"
    | "video_upload"
    | "signature"
    | "location_picker"
    | "address"
    | "matrix_mc" // Multiple Choice Grid
    | "matrix_cb" // Checkbox Grid
    | "ranking"
    | "consent"
    | "rich_text"
    | "image_block"
    | "video_block"
    | "divider"
    | "section_break"
    | "page_break";
  title: string;
  description?: string;
  options?: string[]; // Used for MC, Checkboxes, Dropdowns, Ranking, Grid Rows
  gridColumns?: string[]; // Used only for Matrix MC and Checkbox Grid
  required: boolean;
  validation?: QuestionValidation;
  logic?: ConditionalLogic;

  // Quiz Mode properties
  points?: number;
  correctAnswer?: string | string[]; // Single option string or array of correct checkbox answers
  feedback?: {
    correct?: string;
    incorrect?: string;
  };
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentId: string;
  answers: Record<string, any>; // maps questionId to actual answer values
  submittedAt: string;
  completionTimeSeconds?: number;
  score?: {
    earnedPoints: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
  };
  metadata?: {
    deviceType: string;
    browser: string;
    operatingSystem: string;
    country: string;
    city?: string;
    qrScanned?: boolean;
  };
}

export interface FormDocument {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  theme: FormTheme;
  settings: FormSettings;
  quizSettings: QuizSettings;
  formCode: string; // e.g. "Ab3K9X"
  status: "draft" | "published";
  questions: Question[];
  responses: FormResponse[];
  createdAt: string;
  updatedAt: string;

  // Collaborative comments
  comments?: Array<{
    id: string;
    author: string;
    avatar?: string;
    text: string;
    createdAt: string;
  }>;

  // Simple activity audit log
  auditLogs?: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
}

// Generates a random alphanumeric code of specified length
export function generateFormCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const DEFAULT_THEME: FormTheme = {
  primary: "#1E2761", // Classic rich Amineva dark blue
  background: "#F5F7FA",
  font: "Inter",
  borderRadius: "md",
  buttonStyle: "solid",
  darkMode: false,
};

export const DEFAULT_SETTINGS: FormSettings = {
  collectEmail: false,
  anonymous: true,
  requireLogin: false,
  oneResponsePerUser: false,
  multipleResponses: true,
  confirmationMessage: "Thank you! Your response has been securely submitted.",
  autoSaveProgress: true,
  language: "en",
  timeZone: "GMT",
};

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  enabled: false,
  passingScore: 70,
  randomQuestions: false,
  shuffleQuestions: false,
  certificates: false,
};

// Seeding standard templates
export const FORM_TEMPLATES: Array<Partial<FormDocument> & { id: string; category: string }> = [
  {
    id: "tpl-scholarship",
    title: "Scholarship Application Form",
    category: "Education",
    description: "Amineva Academic Merit and Leadership Scholarship Application.",
    theme: {
      ...DEFAULT_THEME,
      primary: "#10B981", // Emerald green theme
      borderRadius: "lg",
      buttonStyle: "pill",
    },
    settings: {
      ...DEFAULT_SETTINGS,
      collectEmail: true,
      anonymous: false,
    },
    quizSettings: DEFAULT_QUIZ_SETTINGS,
    questions: [
      {
        id: "q-name",
        type: "short_answer",
        title: "Full Legal Name",
        description: "Please enter your legal first, middle, and last names.",
        required: true,
      },
      {
        id: "q-email",
        type: "email",
        title: "Email Address",
        required: true,
      },
      {
        id: "q-phone",
        type: "phone",
        title: "Contact Phone Number",
        required: true,
      },
      {
        id: "q-address",
        type: "address",
        title: "Current Physical Address",
        required: true,
      },
      {
        id: "q-gpa",
        type: "number",
        title: "Cumulative GPA",
        description: "Must be on a 4.0 weighted scale.",
        required: true,
        validation: { min: 0, max: 4 },
      },
      {
        id: "q-essay",
        type: "long_answer",
        title: "Statement of Purpose & Career Objectives",
        description: "Describe how this scholarship will impact your goals (max 500 words).",
        required: true,
        validation: { maxLength: 3000 },
      },
      {
        id: "q-upload",
        type: "file_upload",
        title: "Academic Transcript & Recommendation Letters",
        description: "Combine files into a single PDF (maximum size 10MB).",
        required: true,
        validation: { fileTypes: ["application/pdf"], maxFileSize: 10 },
      },
      {
        id: "q-sig",
        type: "signature",
        title: "Applicant Digital Signature",
        description: "By signing, you attest that all information is completely truthful.",
        required: true,
      },
    ],
  },
  {
    id: "tpl-customer-feedback",
    title: "Customer Feedback Questionnaire",
    category: "Business",
    description: "Help us refine our products and services. Your honest feedback is invaluable.",
    theme: {
      ...DEFAULT_THEME,
      primary: "#2563EB", // Blue theme
      borderRadius: "xl",
      buttonStyle: "solid",
    },
    settings: DEFAULT_SETTINGS,
    quizSettings: DEFAULT_QUIZ_SETTINGS,
    questions: [
      {
        id: "q-rating",
        type: "rating_star",
        title: "How would you rate your overall experience with our service?",
        required: true,
      },
      {
        id: "q-emoji",
        type: "rating_emoji",
        title: "How did you feel about the checkout process?",
        required: false,
      },
      {
        id: "q-features",
        type: "checkboxes",
        title: "Which aspects did you find most satisfying?",
        options: ["Product Quality", "Fast Shipping", "Customer Support", "Competitive Pricing", "Website Usability"],
        required: true,
      },
      {
        id: "q-recommend",
        type: "linear_scale",
        title: "How likely are you to recommend us to a colleague or friend?",
        description: "Scale from 0 (Not likely at all) to 10 (Extremely likely)",
        required: true,
        validation: { min: 0, max: 10 },
      },
      {
        id: "q-comments",
        type: "long_answer",
        title: "Any additional suggestions or comments for us?",
        required: false,
      },
    ],
  },
  {
    id: "tpl-quiz",
    title: "Amineva Platform Knowledge Quiz",
    category: "Quizzes",
    description: "Test your familiarity with the Amineva Workspace, core modules, and AI capabilities.",
    theme: {
      ...DEFAULT_THEME,
      primary: "#8B5CF6", // Purple theme
      borderRadius: "md",
      buttonStyle: "sharp",
    },
    settings: {
      ...DEFAULT_SETTINGS,
      collectEmail: true,
      anonymous: false,
    },
    quizSettings: {
      enabled: true,
      passingScore: 66,
      randomQuestions: false,
      shuffleQuestions: true,
      certificates: true,
    },
    questions: [
      {
        id: "q-q1",
        type: "multiple_choice",
        title: "Which Amineva module is designed for collaborative real-time spreadsheets?",
        options: ["Amineva Docs", "Amineva Sheets", "Amineva Slides", "Amineva Mail"],
        required: true,
        points: 5,
        correctAnswer: "Amineva Sheets",
        feedback: {
          correct: "Spot on! Amineva Sheets is the enterprise grid-engine.",
          incorrect: "Remember, Sheets is the core database grid tool.",
        },
      },
      {
        id: "q-q2",
        type: "checkboxes",
        title: "What represents the branding/AI name used across the Amineva Workspace?",
        options: ["Amineva AI", "Dipa AI", "Amineva Intelligence", "Dipa"],
        required: true,
        points: 5,
        correctAnswer: ["Dipa AI", "Dipa"],
        feedback: {
          correct: "Correct! Dipa is the exclusive branding for all AI companion services.",
          incorrect: "Remember, we exclusively brand our smart intelligence as 'Dipa'.",
        },
      },
      {
        id: "q-q3",
        type: "yes_no",
        title: "Does Amineva support exporting files directly to PDF format?",
        required: true,
        points: 5,
        correctAnswer: "Yes",
        feedback: {
          correct: "Indeed! High-fidelity PDF compilation is supported natively.",
        },
      },
    ],
  },
];

// Seed initial forms in local storage if empty
export async function listForms(): Promise<FormDocument[]> {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem("amineva_forms");
  if (!raw) {
    // Populate with default populated documents
    const seeded: FormDocument[] = FORM_TEMPLATES.map((tpl, i) => {
      const code = generateFormCode();
      const now = new Date();
      now.setHours(now.getHours() - i * 4); // staggered times
      return {
        id: tpl.id,
        ownerId: "usr-demo",
        title: tpl.title || "Seeded Form",
        description: tpl.description,
        theme: tpl.theme || DEFAULT_THEME,
        settings: tpl.settings || DEFAULT_SETTINGS,
        quizSettings: tpl.quizSettings || DEFAULT_QUIZ_SETTINGS,
        formCode: code,
        status: "draft",
        questions: tpl.questions || [],
        responses: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        comments: [],
        auditLogs: [
          {
            id: "log-1",
            user: "Workspace Demo Owner",
            action: "Form instantiated from system preset template",
            timestamp: now.toISOString(),
          }
        ],
      };
    });
    localStorage.setItem("amineva_forms", JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse amineva_forms localstorage", e);
    return [];
  }
}

export async function getFormById(id: string): Promise<FormDocument | null> {
  const list = await listForms();
  const found = list.find((f) => f.id === id || f.formCode === id);
  if (found) return found;

  // Fallback: Create form on demand so link never opens blank
  const now = new Date().toISOString();
  const code = generateFormCode();
  const fallback: FormDocument = {
    id,
    ownerId: "usr-demo",
    title: "Untitled Form",
    description: "Amineva Form created in Workspace.",
    theme: { ...DEFAULT_THEME },
    settings: { ...DEFAULT_SETTINGS },
    quizSettings: { ...DEFAULT_QUIZ_SETTINGS },
    formCode: code,
    status: "draft",
    questions: [
      {
        id: "q-first",
        type: "short_answer",
        title: "Untitled Question 1",
        required: false,
      },
    ],
    responses: [],
    createdAt: now,
    updatedAt: now,
    comments: [],
    auditLogs: [],
  };
  list.unshift(fallback);
  localStorage.setItem("amineva_forms", JSON.stringify(list));
  return fallback;
}

export async function getFormByCode(code: string): Promise<FormDocument | null> {
  const list = await listForms();
  const found = list.find((f) => f.formCode === code || f.id === code);
  if (found) return found;
  return getFormById(code);
}

export async function createForm(title: string, templateId?: string): Promise<FormDocument | null> {
  const list = await listForms();
  const now = new Date().toISOString();
  const code = generateFormCode();

  let questions: Question[] = [];
  let description = "Draft form built within Amineva Workspace.";
  let theme = { ...DEFAULT_THEME };
  let settings = { ...DEFAULT_SETTINGS };
  let quizSettings = { ...DEFAULT_QUIZ_SETTINGS };

  if (templateId) {
    const found = FORM_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      questions = found.questions ? JSON.parse(JSON.stringify(found.questions)) : [];
      description = found.description || "";
      theme = found.theme ? { ...found.theme } : theme;
      settings = found.settings ? { ...found.settings } : settings;
      quizSettings = found.quizSettings ? { ...found.quizSettings } : quizSettings;
    }
  } else {
    // default blank form starts with 1 template short answer question
    questions = [
      {
        id: "q-first",
        type: "short_answer",
        title: "Untitled Question 1",
        required: false,
      },
    ];
  }

  const newDoc: FormDocument = {
    id: `form-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ownerId: "usr-demo",
    title,
    description,
    theme,
    settings,
    quizSettings,
    formCode: code,
    status: "draft",
    questions,
    responses: [],
    createdAt: now,
    updatedAt: now,
    comments: [],
    auditLogs: [
      {
        id: "log-init",
        user: "Workspace Demo Owner",
        action: `Form created ${templateId ? `from preset template '${templateId}'` : "as blank canvas"}`,
        timestamp: now,
      }
    ],
  };

  list.unshift(newDoc);
  localStorage.setItem("amineva_forms", JSON.stringify(list));
  return newDoc;
}

export async function updateForm(id: string, updates: Partial<FormDocument>): Promise<boolean> {
  const list = await listForms();
  const index = list.findIndex((f) => f.id === id);
  if (index === -1) return false;

  const original = list[index];
  const now = new Date().toISOString();

  // Create audit trail for meaningful changes
  const logs = [...(original.auditLogs || [])];
  if (updates.status && updates.status !== original.status) {
    logs.push({
      id: `log-${Date.now()}`,
      user: "Workspace Demo Owner",
      action: `Published state changed to: ${updates.status.toUpperCase()}`,
      timestamp: now,
    });
  }
  if (updates.questions && updates.questions.length !== original.questions.length) {
    logs.push({
      id: `log-${Date.now()}`,
      user: "Workspace Demo Owner",
      action: `Question structures updated. Total count: ${updates.questions.length}`,
      timestamp: now,
    });
  }

  list[index] = {
    ...original,
    ...updates,
    auditLogs: logs,
    updatedAt: now,
  };

  localStorage.setItem("amineva_forms", JSON.stringify(list));
  return true;
}

export async function deleteForm(id: string): Promise<boolean> {
  const list = await listForms();
  const filtered = list.filter((f) => f.id !== id);
  if (list.length === filtered.length) return false;

  localStorage.setItem("amineva_forms", JSON.stringify(filtered));
  return true;
}

export async function duplicateForm(form: FormDocument): Promise<FormDocument | null> {
  const list = await listForms();
  const now = new Date().toISOString();
  const code = generateFormCode();

  const duplicated: FormDocument = {
    ...JSON.parse(JSON.stringify(form)),
    id: `form-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: `${form.title} (Copy)`,
    formCode: code,
    responses: [], // Clear out responses
    createdAt: now,
    updatedAt: now,
    comments: [],
    auditLogs: [
      {
        id: "log-dup",
        user: "Workspace Demo Owner",
        action: `Cloned from existing form: '${form.title}'`,
        timestamp: now,
      }
    ],
  };

  list.unshift(duplicated);
  localStorage.setItem("amineva_forms", JSON.stringify(list));
  return duplicated;
}

export async function submitFormResponse(formId: string, respondentId: string, answers: Record<string, any>, metadata?: any): Promise<FormResponse | null> {
  const list = await listForms();
  const index = list.findIndex((f) => f.id === formId);
  if (index === -1) return null;

  const form = list[index];
  const now = new Date().toISOString();

  // Evaluate scores if Quiz Mode is enabled
  let scoreInfo: any = undefined;
  if (form.quizSettings.enabled) {
    let earnedPoints = 0;
    let totalPoints = 0;

    form.questions.forEach((q) => {
      if (q.points) {
        totalPoints += q.points;
        const answer = answers[q.id];

        if (q.type === "checkboxes") {
          // Multiple correct checkbox selections
          const correctOnes = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer].filter(Boolean) as string[];
          const answersArr = Array.isArray(answer) ? answer : [answer].filter(Boolean);

          const correctAndMatches = correctOnes.length === answersArr.length && correctOnes.every(val => answersArr.includes(val));
          if (correctAndMatches) {
            earnedPoints += q.points;
          }
        } else {
          // Standard single value
          if (answer && String(answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
            earnedPoints += q.points;
          }
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    scoreInfo = {
      earnedPoints,
      totalPoints,
      percentage,
      passed: percentage >= form.quizSettings.passingScore,
    };
  }

  const newResponse: FormResponse = {
    id: `resp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    formId,
    respondentId: respondentId || "anonymous-respondent",
    answers,
    submittedAt: now,
    score: scoreInfo,
    metadata: metadata || {
      deviceType: "Desktop",
      browser: "Chrome",
      operatingSystem: "Linux",
      country: "United States",
    },
  };

  const updatedResponses = [...(form.responses || []), newResponse];
  list[index] = {
    ...form,
    responses: updatedResponses,
    updatedAt: now,
  };

  localStorage.setItem("amineva_forms", JSON.stringify(list));
  return newResponse;
}
