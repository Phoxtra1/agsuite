import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface DBBackupState {
  folders: any[];
  uploadedFiles: any[];
  starredIds: string[];
  trashedIds: string[];
  itemFolders: Record<string, string>;
  itemNames: Record<string, string>;
  driveName: string;
  pinnedIds?: string[];
}

export async function saveDriveToDatabase(state: DBBackupState) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    await supabase
      .from("workspace_drive_state")
      .upsert({ user_id: user.id, state_json: state as unknown as Json }, { onConflict: "user_id" });
  } catch (e) {
    console.error("[drive-sync] Failed to save drive state to DB", e);
  }
}

export async function loadDriveFromDatabase(): Promise<DBBackupState | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    const { data } = await supabase
      .from("workspace_drive_state")
      .select("state_json")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.state_json) return data.state_json as unknown as DBBackupState;
  } catch (e) {
    console.error("[drive-sync] Failed to load drive state from DB", e);
  }
  return null;
}
