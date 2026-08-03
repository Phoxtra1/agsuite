import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { OfflineIndicator } from "@/components/workspace/OfflineIndicator";
import WorkspaceDashboard from "./workspace/Dashboard";

const DocsList = lazy(() => import("./workspace/DocsList"));
const DocsEditor = lazy(() => import("./workspace/DocsEditor"));
const SheetsList = lazy(() => import("./workspace/SheetsList"));
const SheetsEditor = lazy(() => import("./workspace/SheetsEditor"));
const SlidesList = lazy(() => import("./workspace/SlidesList"));
const SlidesEditor = lazy(() => import("./workspace/SlidesEditor"));
const FormsList = lazy(() => import("./workspace/FormsList"));
const FormsEditor = lazy(() => import("./workspace/FormsEditor"));
const DriveList = lazy(() => import("./workspace/DriveList"));

function Fallback() {
  return (
    <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export default function Workspace() {
  return (
    <Suspense fallback={<Fallback />}>
      <OfflineIndicator />
      <Routes>
        {/* Full-bleed editors (no sidebar) */}
        <Route path="docs/:id" element={<DocsEditor />} />
        <Route path="sheets/:id" element={<SheetsEditor />} />
        <Route path="slides/:id" element={<SlidesEditor />} />
        <Route path="forms/:id" element={<FormsEditor />} />
        <Route path="drive" element={<DriveList />} />

        {/* Sidebar layout */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-background">
              <WorkspaceNav />
              <main className="md:ml-64">
                <Suspense fallback={<Fallback />}>
                  <Routes>
                    <Route index element={<WorkspaceDashboard />} />
                    <Route path="docs" element={<DocsList />} />
                    <Route path="sheets" element={<SheetsList />} />
                    <Route path="slides" element={<SlidesList />} />
                    <Route path="forms" element={<FormsList />} />
                    <Route path="*" element={<Navigate to="/workspace" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
