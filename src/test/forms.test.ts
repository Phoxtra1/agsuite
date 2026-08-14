import { describe, it, expect, beforeEach } from "vitest";
import {
  generateFormCode,
  createForm,
  getFormById,
  updateForm,
  duplicateForm,
  submitFormResponse,
  FORM_TEMPLATES
} from "@/lib/workspace/forms/documents";
import { setWorkspaceUser } from "@/lib/workspace/scope";

describe("Amineva Forms local data layer tests", () => {
  beforeEach(() => {
    localStorage.clear();
    setWorkspaceUser("test-user-forms");
  });

  it("should generate proper 6-character alphanumeric formCodes", () => {
    const code = generateFormCode();
    expect(code).toHaveLength(6);
    expect(typeof code).toBe("string");
  });

  it("should support seeding list of forms and default preset templates", async () => {
    const blankForm = await createForm("My Custom Quiz Title", "tpl-quiz");
    expect(blankForm).not.toBeNull();
    expect(blankForm!.title).toBe("My Custom Quiz Title");
    expect(blankForm!.quizSettings.enabled).toBe(true);
    expect(blankForm!.questions.length).toBeGreaterThan(0);
  });

  it("should support duplicating existing forms", async () => {
    const f = await createForm("Main Registration Form");
    expect(f).not.toBeNull();

    const clone = await duplicateForm(f!);
    expect(clone).not.toBeNull();
    expect(clone!.title).toBe("Main Registration Form (Copy)");
    expect(clone!.formCode).not.toBe(f!.formCode);
  });

  it("should score quiz modes properly on submission", async () => {
    const quizForm = await createForm("Platform Test", "tpl-quiz");
    expect(quizForm).not.toBeNull();

    // Submit correct answers
    const answers = {
      "q-q1": "Amineva Sheets",
      "q-q2": ["Dipa AI", "Dipa"],
      "q-q3": "Yes"
    };

    const resp = await submitFormResponse(quizForm!.id, "test-user", answers);
    expect(resp).not.toBeNull();
    expect(resp!.score).toBeDefined();
    expect(resp!.score!.passed).toBe(true);
    expect(resp!.score!.earnedPoints).toBe(15);
  });
});
