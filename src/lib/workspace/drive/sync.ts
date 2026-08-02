import { supabase } from "@/integrations/supabase/client";

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

    // Fetch user profiles
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, metadata")
      .eq("user_id", user.id);

    if (fetchError || !profiles || profiles.length === 0) return;

    // Update metadata across all user profiles
    for (const profile of profiles) {
      const currentMetadata = (profile.metadata as Record<string, any>) || {};
      const updatedMetadata = {
        ...currentMetadata,
        amineva_drive: state
      };

      await supabase
        .from("profiles")
        .update({ metadata: updatedMetadata })
        .eq("id", profile.id);
    }
  } catch (e) {
    console.error("[drive-sync] Failed to save drive state to DB", e);
  }
}

export async function loadDriveFromDatabase(): Promise<DBBackupState | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("metadata")
      .eq("user_id", user.id);

    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        const metadata = p.metadata as Record<string, any>;
        if (metadata?.amineva_drive) {
          return metadata.amineva_drive;
        }
      }
    }
  } catch (e) {
    console.error("[drive-sync] Failed to load drive state from DB", e);
  }
  return null;
}
