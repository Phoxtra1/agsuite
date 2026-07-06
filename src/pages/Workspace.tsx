import { Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import WorkspaceDashboard from "./workspace/Dashboard";
import DocsList from "./workspace/DocsList";
import DocsEditor from "./workspace/DocsEditor";
import SheetsList from "./workspace/SheetsList";
import SheetsEditor from "./workspace/SheetsEditor";
import SlidesList from "./workspace/SlidesList";
import SlidesEditor from "./workspace/SlidesEditor";

export default function Workspace() {
  return (
    <Routes>
      {/* Full-bleed editors (no sidebar) */}
      <Route path="docs/:id" element={<DocsEditor />} />
      <Route path="sheets/:id" element={<SheetsEditor />} />
      <Route path="slides/:id" element={<SlidesEditor />} />

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
                <Route path="sheets" element={<SheetsList />} />
                <Route path="slides" element={<SlidesList />} />
                <Route path="*" element={<Navigate to="/workspace" replace />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  );
}
