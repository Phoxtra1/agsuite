import { supabase } from "@/integrations/appwrite/client";
import { getWorkspaceUser } from "@/lib/workspace/scope";
import { readWorkspaceCollection, writeWorkspaceCollection } from "@/lib/workspace/localStore";
import { reconcile, scheduleRemote, upsertRemote, deleteRemote, isRealUser, isRemoteId, suppressTombstonedRemoteRows, isWorkspaceRecordDeleted } from "@/lib/workspace/remoteSync";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";

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
    | "matrix_mc"
    | "matrix_cb"
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
  options?: string[];
  gridColumns?: string[];
  required: boolean;
  validation?: QuestionValidation;
  logic?: ConditionalLogic;

  // Quiz Mode properties
  points?: number;
  correctAnswer?: string | string[];
  feedback?: {
    correct?: string;
    incorrect?: string;
  };
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentId: string;
  answers: Record<string, any>;
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

  comments?: Array<{
    id: string;
    author: string;
    avatar?: string;
    text: string;
    createdAt: string;
  }>;

  auditLogs?: Array<{
    id: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
}

export function generateFormCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const DEFAULT_THEME: FormTheme = {
  primary: "#1E2761",
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

export const FORM_TEMPLATES: Array<Partial<FormDocument> & { id: string; category: string }> = [
  {
    id: "tpl-scholarship",
    title: "Scholarship Application Form",
    category: "Education",
    description: "Amineva Academic Merit and Leadership Scholarship Application.",
    theme: {
      ...DEFAULT_THEME,
      primary: "#10B981",
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
      { id: "q-name", type: "short_answer", title: "Full Legal Name", required: true },
      { id: "q-email", type: "email", title: "Email Address", required: true },
      { id: "q-phone", type: "phone", title: "Contact Phone Number", required: true },
      { id: "q-address", type: "address", title: "Current Physical Address", required: true },
      { id: "q-gpa", type: "number", title: "Cumulative GPA", required: true, validation: { min: 0, max: 4 } },
      { id: "q-essay", type: "long_answer", title: "Statement of Purpose & Career Objectives", required: true, validation: { maxLength: 3000 } },
      { id: "q-upload", type: "file_upload", title: "Academic Transcript & Recommendation Letters", required: true, validation: { fileTypes: ["application/pdf"], maxFileSize: 10 } },
      { id: "q-sig", type: "signature", title: "Applicant Digital Signature", required: true },
    ],
  },
  {
    id: "tpl-customer-feedback",
    title: "Customer Feedback Questionnaire",
    category: "Business",
    description: "Help us refine our products and services. Your honest feedback is invaluable.",
    theme: {
      ...DEFAULT_THEME,
      primary: "#2563EB",
      borderRadius: "xl",
      buttonStyle: "solid",
    },
    settings: DEFAULT_SETTINGS,
    quizSettings: DEFAULT_QUIZ_SETTINGS,
    questions: [
      { id: "q-rating", type: "rating_star", title: "How would you rate your overall experience with our service?", required: true },
      { id: "q-emoji", type: "rating_emoji", title: "How did you feel about the checkout process?", required: false },
      { id: "q-features", type: "checkboxes", title: "Which aspects did you find most satisfying?", options: ["Product Quality", "Fast Shipping", "Customer Support", "Competitive Pricing", "Website Usability"], required: true },
      { id: "q-recommend", type: "linear_scale", title: "How likely are you to recommend us to a colleague or friend?", required: true, validation: { min: 0, max: 10 } },
      { id: "q-comments", type: "long_answer", title: "Any additional suggestions or comments for us?", required: false },
    ],
  },
  {
    id: "tpl-quiz",
    title: "Amineva Platform Knowledge Quiz",
    category: "Quizzes",
    description: "Test your familiarity with the Amineva Workspace, core modules, and AI capabilities.",
    theme: {
      ...DEFAULT_THEME,
      primary: "#8B5CF6",
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

const TBL = "workspace_forms" as any;
const toRow = (f: FormDocument, userId: string) => {
  const owner = isRealUser(f.ownerId) ? f.ownerId : userId;
  return { form_id: f.formCode || f.id, title: (f.title || "Untitled Form").slice(0, 255), owner_id: owner, schema_json: JSON.stringify({ ...f, ownerId: owner }) };
};
function pushForm(f: FormDocument) {
  const owner = isRealUser(f.ownerId) ? f.ownerId : getWorkspaceUser();
  if (!isRealUser(owner) || !isRemoteId(f.id)) return;
  scheduleRemote(`${TBL}:${f.id}`, () => upsertRemote(TBL, f.id, toRow(f, owner)));
}
async function getLocalForms(): Promise<FormDocument[]> {
  return readWorkspaceCollection("amineva_forms");
}

async function saveLocalForms(records: FormDocument[]): Promise<void> {
  await writeWorkspaceCollection("amineva_forms", records);
}

async function getAuthenticatedUserId(): Promise<string> {
  if (isWorkspaceOfflineMode()) return getWorkspaceUser();
  try {
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null }, error: new Error("Timeout") }), 600)
    );
    const { data } = await Promise.race([getUserPromise, timeoutPromise]);
    if (data?.user?.id) return data.user.id;
  } catch {}
  const scopeUser = getWorkspaceUser();
  if (scopeUser && scopeUser !== "anon") return scopeUser;
  return "local-user";
}

function mapRemoteRowToForm(row: any): FormDocument {
  const schema = typeof row.schema_json === "string" ? JSON.parse(row.schema_json || "{}") : (row.schema_json || {});
  return {
    id: schema.id || row.id || row.form_id,
    ownerId: row.owner_id || schema.ownerId || "",
    title: row.title || schema.title || "Untitled Form",
    description: schema.description || "",
    theme: schema.theme || DEFAULT_THEME,
    settings: schema.settings || DEFAULT_SETTINGS,
    quizSettings: schema.quizSettings || DEFAULT_QUIZ_SETTINGS,
    formCode: schema.formCode || row.form_id || generateFormCode(),
    status: row.status || schema.status || "draft",
    questions: schema.questions || [],
    responses: schema.responses || [],
    createdAt: schema.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: schema.updatedAt || row.updated_at || new Date().toISOString(),
    comments: schema.comments || [],
    auditLogs: schema.auditLogs || [],
  };
}

export async function listForms(): Promise<FormDocument[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const local = await getLocalForms();
  if (isWorkspaceOfflineMode() || (typeof navigator !== "undefined" && !navigator.onLine)) return local;

  try {
    const queryPromise = supabase.from(TBL).select("*").eq("owner_id", userId).order("updated_at", { ascending: false });
    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Timeout") }), 2500)
    );
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
    if (!error && data && Array.isArray(data)) {
      const remoteForms = await suppressTombstonedRemoteRows(TBL, data.map(mapRemoteRowToForm));
      const merged = reconcile({ table: TBL, local: await getLocalForms(), remote: remoteForms, userId, updatedAt: (f) => f.updatedAt, toRow });
      await saveLocalForms(merged);
      return merged;
    }
  } catch (e) {
    console.warn("[forms] Offline fetch fallback", e);
  }
  return local;
}

export async function getFormById(id: string): Promise<FormDocument | null> {
  const local = await getLocalForms();
  const cached = local.find((f) => f.id === id || f.formCode === id);
  if (cached || isWorkspaceOfflineMode() || (typeof navigator !== "undefined" && !navigator.onLine)) return cached ?? null;
  if (await isWorkspaceRecordDeleted(TBL, id)) return null;

  try {
    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase.from(TBL).select("*").eq("id", id).eq("owner_id", userId).maybeSingle();
    if (!error && data) {
      const form = mapRemoteRowToForm(data);
      const idx = local.findIndex((f) => f.id === id);
      if (idx >= 0) local[idx] = form;
      else local.unshift(form);
      await saveLocalForms(local);
      return form;
    }
  } catch (e) {
    console.warn("[forms] Offline get form", e);
  }

  return local.find((f) => f.id === id || f.formCode === id) ?? null;
}

export async function getFormByCode(code: string): Promise<FormDocument | null> {
  return getFormById(code);
}

export async function createForm(title: string, templateId?: string): Promise<FormDocument> {
  const userId = await getAuthenticatedUserId();
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
    questions = [{ id: "q-first", type: "short_answer", title: "Untitled Question 1", required: false }];
  }

  const newDoc: FormDocument = {
    id: `form-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ownerId: userId,
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
        user: userId,
        action: `Form created ${templateId ? `from preset template '${templateId}'` : "as blank canvas"}`,
        timestamp: now,
      },
    ],
  };

  const local = await getLocalForms();
  local.unshift(newDoc);
  await saveLocalForms(local);
  pushForm(newDoc);
  return newDoc;
}

export async function updateForm(id: string, updates: Partial<FormDocument>): Promise<boolean> {
  const local = await getLocalForms();
  const index = local.findIndex((f) => f.id === id);
  if (index === -1) return false;

  const original = local[index];
  const now = new Date().toISOString();

  const logs = [...(original.auditLogs || [])];
  if (updates.status && updates.status !== original.status) {
    logs.push({
      id: `log-${Date.now()}`,
      user: "Workspace Owner",
      action: `Published state changed to: ${updates.status.toUpperCase()}`,
      timestamp: now,
    });
  }

  const updatedDoc: FormDocument = {
    ...original,
    ...updates,
    auditLogs: logs,
    updatedAt: now,
  };

  local[index] = updatedDoc;
  await saveLocalForms(local);
  pushForm(updatedDoc);
  return true;
}

export async function deleteForm(id: string): Promise<boolean> {
  const local = await getLocalForms();
  const filtered = local.filter((f) => f.id !== id);
  await saveLocalForms(filtered);
  await deleteRemote(TBL, id);
  return true;
}

export async function duplicateForm(form: FormDocument): Promise<FormDocument | null> {
  const userId = await getAuthenticatedUserId();
  const now = new Date().toISOString();
  const code = generateFormCode();

  const duplicated: FormDocument = {
    ...JSON.parse(JSON.stringify(form)),
    id: `form-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ownerId: userId,
    title: `${form.title} (Copy)`,
    formCode: code,
    responses: [],
    createdAt: now,
    updatedAt: now,
    auditLogs: [
      {
        id: "log-dup",
        user: userId,
        action: `Cloned from existing form: '${form.title}'`,
        timestamp: now,
      },
    ],
  };

  const local = await getLocalForms();
  local.unshift(duplicated);
  await saveLocalForms(local);
  pushForm(duplicated);
  return duplicated;
}

export async function submitFormResponse(
  formId: string,
  respondentId: string,
  answers: Record<string, any>,
  metadata?: any
): Promise<FormResponse | null> {
  const local = await getLocalForms();
  const index = local.findIndex((f) => f.id === formId);
  if (index === -1) return null;

  const form = local[index];
  const now = new Date().toISOString();

  let scoreInfo: any = undefined;
  if (form.quizSettings.enabled) {
    let earnedPoints = 0;
    let totalPoints = 0;

    form.questions.forEach((q) => {
      if (q.points) {
        totalPoints += q.points;
        const answer = answers[q.id];

        if (q.type === "checkboxes") {
          const correctOnes = Array.isArray(q.correctAnswer)
            ? q.correctAnswer
            : [q.correctAnswer].filter(Boolean) as string[];
          const answersArr = Array.isArray(answer) ? answer : [answer].filter(Boolean);

          const correctAndMatches =
            correctOnes.length === answersArr.length && correctOnes.every((val) => answersArr.includes(val));
          if (correctAndMatches) {
            earnedPoints += q.points;
          }
        } else {
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
  const updatedForm = {
    ...form,
    responses: updatedResponses,
    updatedAt: now,
  };

  local[index] = updatedForm;
  await saveLocalForms(local);

  try {
    await supabase
      .from(TBL)
      .update({
        schema_json: JSON.stringify(updatedForm),
      })
      .eq("id", formId);
  } catch (e) {
    console.warn("[forms] Failed to record response in Supabase", e);
  }

  return newResponse;
}
