import { Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import WorkspaceDashboard from "./workspace/Dashboard";
import DocsList from "./workspace/DocsList";
import DocsEditor from "./workspace/DocsEditor";

export default function Workspace() {
  return (
    <Routes>
      {/* Full-bleed editor (no sidebar) */}
      <Route path="docs/:id" element={<DocsEditor />} />

      {/* Sidebar layout */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-background">
            <WorkspaceNav />
            <main className="ml-64">
              <Routes>
                <Route index element={<WorkspaceDashboard />} />
                <Route path="docs" element={<DocsList />} />
                <Route path="*" element={<Navigate to="/workspace" replace />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  );
}
