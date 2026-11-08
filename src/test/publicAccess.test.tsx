import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PUBLIC_AUTH_PAUSED, publicEntryPath, TEMPORARY_WORKSPACE_SCOPE } from "@/lib/auth/availability";
import { WorkspaceGate, useWorkspaceSession } from "@/components/workspace/WorkspaceGate";
import { getWorkspaceUser, setWorkspaceUser } from "@/lib/workspace/scope";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => { throw new Error("Public access must not request authentication"); } }));

afterEach(cleanup);

describe("temporary public access", () => {
  it("opens Workspace without authentication and isolates existing account files", () => {
    expect(PUBLIC_AUTH_PAUSED).toBe(true);
    setWorkspaceUser("private-account");
    function Content() {
      const session = useWorkspaceSession();
      return <span>{session.userId}</span>;
    }
    render(<WorkspaceGate><Content /></WorkspaceGate>);
    expect(screen.getByText(TEMPORARY_WORKSPACE_SCOPE)).toBeTruthy();
    expect(getWorkspaceUser()).toBe(TEMPORARY_WORKSPACE_SCOPE);
    expect(isWorkspaceOfflineMode()).toBe(true);
  });

  it("bypasses sign-in links without permitting external or admin redirects", () => {
    expect(publicEntryPath("/workspace/docs")).toBe("/workspace/docs");
    expect(publicEntryPath("/workspace")).toBe("/workspace");
    expect(publicEntryPath("https://example.com")).toBe("/info-discovery");
    expect(publicEntryPath("/suite/console")).toBe("/info-discovery");
  });
});