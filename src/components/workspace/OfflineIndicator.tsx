import { useEffect, useState } from "react";
import { Cloud, CloudOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function OfflineIndicator() {
  const { user } = useAuth() as any;
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!user) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-3 bottom-3 z-[100] flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-lg ${
        online
          ? "border-border bg-card text-muted-foreground"
          : "border-amber-500/40 bg-card text-amber-500"
      }`}
    >
      {online ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      {online ? "Online · all changes synced" : "Offline mode · changes saved on this device"}
    </div>
  );
}