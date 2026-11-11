import { useEffect, useState } from "react";
import { CloudOff, Cloud } from "lucide-react";

export function NetworkStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let restoredTimer: ReturnType<typeof setTimeout> | undefined;
    const handleOffline = () => {
      if (restoredTimer) clearTimeout(restoredTimer);
      setShowRestored(false);
      setOnline(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setShowRestored(true);
      restoredTimer = setTimeout(() => setShowRestored(false), 3500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (restoredTimer) clearTimeout(restoredTimer);
    };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={online
        ? "fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-emerald-700 px-4 py-2 text-center text-xs font-medium text-white shadow-md"
        : "fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-slate-950 shadow-md"}
    >
      {online ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      {online
        ? "Connection restored. Online services can reconnect."
        : "You are offline. Previously loaded pages and locally saved work remain available; cloud services and external media may need internet."}
    </div>
  );
}

export default NetworkStatus;
