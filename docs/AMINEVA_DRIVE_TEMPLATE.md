# Amineva Drive — Build Template

Unified storage layer for every Workspace document, export and upload.

## 1. Storage

Create a private bucket `workspace-drive`. Object path convention:

```text
{user_id}/{folder_path}/{file_id}-{original_name}
```

All access goes through signed URLs (default TTL 60s for preview, 300s for download).

## 2. Database

```sql
-- Folders
CREATE TABLE public.drive_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.drive_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drive_folders TO authenticated;
GRANT ALL ON public.drive_folders TO service_role;
ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own folders" ON public.drive_folders
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Files (both uploads and links to Workspace docs/sheets/slides/forms)
CREATE TABLE public.drive_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.drive_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  kind text NOT NULL,            -- 'upload' | 'doc' | 'sheet' | 'slide' | 'form'
  source_id uuid,                -- workspace_documents.id etc. when kind <> 'upload'
  storage_path text,             -- set when kind = 'upload'
  mime_type text,
  size_bytes bigint DEFAULT 0,
  starred boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drive_files TO authenticated;
GRANT ALL ON public.drive_files TO service_role;
ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own files" ON public.drive_files
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Sharing
CREATE TABLE public.drive_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.drive_files(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  access text NOT NULL DEFAULT 'view',   -- 'view' | 'comment' | 'edit'
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.drive_shares TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drive_shares TO authenticated;
GRANT ALL ON public.drive_shares TO service_role;
ALTER TABLE public.drive_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read by token" ON public.drive_shares
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owner manages shares" ON public.drive_shares
  FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
```

## 3. Data layer — `src/lib/workspace/drive/documents.ts`

```ts
export type DriveKind = "upload" | "doc" | "sheet" | "slide" | "form";

export interface DriveFile {
  id: string; name: string; kind: DriveKind; folderId: string | null;
  mimeType?: string; sizeBytes: number; starred: boolean;
  trashedAt?: string | null; updatedAt: string;
}

listFolder(folderId: string | null): Promise<{ folders: DriveFolder[]; files: DriveFile[] }>
createFolder(name: string, parentId?: string | null): Promise<DriveFolder | null>
uploadFile(file: File, folderId?: string | null): Promise<DriveFile | null>
renameItem(id: string, name: string, type: "file" | "folder"): Promise<boolean>
moveItem(id: string, folderId: string | null): Promise<boolean>
toggleStar(id: string): Promise<boolean>
trashItem(id: string): Promise<boolean>          // sets trashed_at
restoreItem(id: string): Promise<boolean>
purgeItem(id: string): Promise<boolean>          // deletes row + storage object
getSignedUrl(file: DriveFile, ttl?: number): Promise<string | null>
createShare(fileId: string, access?: "view" | "edit"): Promise<string | null>  // returns /drive/shared/:token
searchDrive(query: string): Promise<DriveFile[]>
storageUsage(): Promise<{ used: number; quota: number }>
```

Workspace docs/sheets/slides/forms are *registered* into Drive on save (`kind` set,
`source_id` pointing at the source row) so Drive is a single index, not a copy.

## 4. Routes

```text
/workspace/drive                 → DriveBrowser (My Drive)
/workspace/drive/folder/:id      → DriveBrowser scoped to folder
/workspace/drive/recent          → last 50 by updated_at
/workspace/drive/starred         → starred = true
/workspace/drive/trash           → trashed_at not null
/drive/shared/:token             → public SharedFileViewer
```

Register in `src/pages/Workspace.tsx` alongside the other module routes.

## 5. Components — `src/components/workspace/drive/`

| Component | Responsibility |
|---|---|
| `DriveSidebar.tsx` | My Drive / Recent / Starred / Trash + storage meter |
| `DriveToolbar.tsx` | New folder, Upload, Import from Docs/Sheets/Slides, view toggle, sort |
| `DriveBreadcrumbs.tsx` | Folder path navigation |
| `DriveGrid.tsx` | Card view with type icons and thumbnails |
| `DriveTable.tsx` | List view: Name, Owner, Type, Size, Modified |
| `DriveContextMenu.tsx` | Open, Rename, Move, Star, Share, Download, Trash |
| `DriveUploadDropzone.tsx` | Drag-and-drop with per-file progress |
| `DrivePreviewDialog.tsx` | Inline preview: PDF, image, text, Workspace docs |
| `DriveShareDialog.tsx` | Link access level + expiry + copy link |
| `DriveStorageMeter.tsx` | Used / quota bar |

## 6. Registry entry — `src/lib/workspace/modules.ts`

```ts
{
  id: "amineva-drive",
  name: "Amineva Drive",
  description: "Unified storage layer for every Workspace document and export.",
  status: "active",
  icon: FolderOpen,
  route: "/workspace/drive",
  accent: "bg-sky-500/15 text-sky-500",
}
```

Add the matching `NavLink` to `src/components/workspace/WorkspaceNav.tsx`.

## 7. Build order

1. Migration (tables + grants + RLS) and the private bucket.
2. `documents.ts` data layer with local-storage fallback, mirroring the Docs module.
3. `DriveBrowser` page with sidebar, breadcrumbs, grid/table toggle.
4. Upload + download + signed-URL preview.
5. Star / move / trash / restore / purge.
6. Sharing links and the public viewer route.
7. Auto-registration hooks in Docs, Sheets, Slides and Forms save paths.
8. Search and the storage meter.
