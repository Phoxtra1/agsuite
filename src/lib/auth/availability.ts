/** Temporary public-access mode while the backend is repaired. Admin access is unchanged. */
export const PUBLIC_AUTH_PAUSED = true;
export const TEMPORARY_WORKSPACE_SCOPE = "temporary-public-workspace";

export function publicEntryPath(returnTo: string | null): string {
  if (returnTo === "/workspace" || returnTo?.startsWith("/workspace/")) return returnTo;
  return "/info-discovery";
}