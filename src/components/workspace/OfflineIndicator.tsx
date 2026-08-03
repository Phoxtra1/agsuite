import { useEffect, useState } from "react";
import { Cloud, CloudOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function dispatchSyncStatus(
  tool: "docs" | "sheets" | "slides" | "forms",
  status: "saving" | "queued" | "synced"
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("amineva-sync-status", {
      detail: { tool, status },
    })
  );
}

export function OfflineIndicator() {
  const { user } = useAuth() as any;
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [statuses, setStatuses] = useState<Record<string, "saving" | "queued" | "synced">>({
    docs: "synced",
    sheets: "synced",
    slides: "synced",
    forms: "synced",
  });

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        tool: string;
        status: "saving" | "queued" | "synced";
      }>;
      const { tool, status } = customEvent.detail;
      setStatuses((prev) => ({
        ...prev,
        [tool]: status,
      }));
    };
    window.addEventListener("amineva-sync-status", handleEvent);
    return () => {
      window.removeEventListener("amineva-sync-status", handleEvent);
    };
  }, []);

  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("localhost");
  if (!user && !isPreview) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-3 bottom-3 z-[100] flex flex-col gap-2 rounded-lg border p-3 text-xs font-medium shadow-xl bg-card transition-all max-w-[280px] ${
        online
          ? "border-border text-muted-foreground"
          : "border-amber-500/40 text-amber-600"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        {online ? <Cloud className="h-4 w-4 text-emerald-500" /> : <CloudOff className="h-4 w-4 text-amber-500 animate-pulse" />}
        <span>{online ? "Online · Cloud Sync Active" : "Offline · Local Saving Only"}</span>
      </div>

      <div className="h-px bg-border/60 my-0.5" />

      <div className="space-y-1.5 text-[11px]">
        {Object.entries(statuses).map(([tool, status]) => (
          <div key={tool} className="flex items-center justify-between gap-6">
            <span className="capitalize font-medium text-foreground/80">{tool}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              status === "saving"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 animate-pulse"
                : status === "queued"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}>
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}