/**
 * Sync status channel.
 *
 * The floating on-screen sync widget was removed for a cleaner, professional
 * workspace surface. `dispatchSyncStatus` is kept as a lightweight event
 * broadcaster so editors can keep reporting their save state without any UI.
 */
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
