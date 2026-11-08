import { afterEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { PUBLIC_AUTH_PAUSED, publicEntryPath, TEMPORARY_WORKSPACE_SCOPE } from "@/lib/auth/availability";
import { WorkspaceGate, useWorkspaceSession } from "@/components/workspace/WorkspaceGate";
import { getWorkspaceUser, setWorkspaceUser } from "@/lib/workspace/scope";
import { isWorkspaceOfflineMode } from "@/lib/workspace/localAccess";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => { throw new Error("Public access must not request authentication"); } }));

afterEach(() => { document.body.innerHTML = ""; });

describe("temporary public access", () => {
  it("opens Workspace without authentication and isolates existing account files", () => {
    expect(PUBLIC_AUTH_PAUSED).toBe(true);
    setWorkspaceUser("private-account");
    function Content() {
      const session = useWorkspaceSession();
      return <span>{session.userId}</span>;
    }
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<WorkspaceGate><Content /></WorkspaceGate>));
    expect(container.textContent).toBe(TEMPORARY_WORKSPACE_SCOPE);
    expect(getWorkspaceUser()).toBe(TEMPORARY_WORKSPACE_SCOPE);
    expect(isWorkspaceOfflineMode()).toBe(true);
    act(() => root.unmount());
  });

  it("bypasses sign-in links without permitting external or admin redirects", () => {
    expect(publicEntryPath("/workspace/docs")).toBe("/workspace/docs");
    expect(publicEntryPath("/workspace")).toBe("/workspace");
    expect(publicEntryPath("https://example.com")).toBe("/info-discovery");
    expect(publicEntryPath("/suite/console")).toBe("/info-discovery");
  });
});