# Workspace + AG Docs — Implementation Plan

A new product **Workspace** added to the Amineva Suite under the **Business Intelligence** category, with **AG Docs** as the first fully functional module. Future modules (AG Sheets, Slides, Forms, Drive) are scaffolded as "Coming Soon" cards using a registry so adding them later requires no redesign.

---

## 1. Product Registration

- Add `workspace` to `DEFAULT_CATEGORIES.business-intelligence.products` in `src/types/product.ts` (alongside `amniva`).
- Seed a `workspace` row in the `applications` table (slug `workspace`, status `active`) so the central auth gate (`AppAuthGate` + `user_app_access`) governs entry.
- Add a `IconWorkspace` SVG in `src/components/icons/ProductIcons.tsx` and wire it in `src/lib/products.ts`.
- Add an explainer landing page `src/pages/landing/WorkspacePage.tsx` (route `/explainer/workspace`) describing Workspace as a data-intelligence hub.

## 2. Workspace Shell (Entry & Dashboard)

- New route tree `/workspace/*` in `src/App.tsx`, gated by `AppAuthGate` with `appSlug="workspace"` (so a Suite account that hasn't been granted Workspace access is sent through the standard "request access" flow — meeting the "create account strictly for workspace" intent via per-app access, not a separate auth system).
- New page `src/pages/Workspace.tsx` rendering a left nav + content area.
- Dashboard (`/workspace`): Amineva-branded header, user profile chip, and a **module card grid** driven by a registry:

  ```text
  workspaceModules = [
    { id: 'ag-docs',   name: 'AG Docs',   status: 'active',       route: '/workspace/docs' },
    { id: 'ag-sheets', name: 'AG Sheets', status: 'coming_soon' },
    { id: 'ag-slides', name: 'AG Slides', status: 'coming_soon' },
    { id: 'ag-forms',  name: 'AG Forms',  status: 'coming_soon' },
    { id: 'ag-drive',  name: 'AG Drive',  status: 'coming_soon' },
  ]
  ```
- A `ComingSoonModal` is reused for inactive cards.

## 3. AG Docs Module (`/workspace/docs`)

Three sub-routes:

- `/workspace/docs` — document list (search, create, rename, duplicate, delete)
- `/workspace/docs/:id` — editor
- `/share/doc/:token` — public/restricted viewer (link sharing, outside auth gate)

### Editor

- **TipTap** (StarterKit + Table, Image, Link, Underline, TextAlign, Color, Highlight, Placeholder).
- Custom **IntelligenceTag** mark/node for tagging selections as `insight | data | summary | evidence | reference` (stored as a TipTap mark with a `tagType` attribute; rendered with a left border + label chip).
- **Floating contextual toolbar** (BubbleMenu) for formatting; a slim top menu bar for File / Edit / Insert / Format / Tools / View.
- Slash-command / Insert menu for image, table, link, divider.
- Tools menu: word count, character count, headings outline (Structure view).
- View menu: zoom (CSS scale), layout mode (page/wide), fullscreen.

### Export

- **PDF**: `html2pdf.js` from the rendered editor DOM.
- **DOC-like**: `.doc` via HTML wrapper download (Word opens it).
- **JSON**: TipTap `getJSON()` — the structured representation, ready for AG Sheets / Forms reuse.
- **CSV**: extract every `table` node and emit one CSV (multiple tables → concatenated with blank lines).

### Sharing

- "Share link" generates a token. Modes: `view` or `edit`.
- Public viewer route reads via the share token, no auth required.

## 4. Data Model (Lovable Cloud)

New tables, all RLS-protected and granted to `authenticated` + `service_role`:

- **`workspace_documents`** — `id, owner_id, title, content_json (jsonb), content_text (for search), updated_at, created_at`. Policies: owner full access; anyone can SELECT if a matching active share row exists.
- **`workspace_document_versions`** — `id, document_id, content_json, created_at, created_by`. Snapshot per save (debounced).
- **`workspace_document_shares`** — `id, document_id, token (unique), mode ('view'|'edit'), created_by, expires_at (nullable), revoked`. Public SELECT allowed by token only via a `SECURITY DEFINER` function `get_shared_document(token text)` to avoid leaking the table.

Also: insert an `applications` row for `workspace`.

## 5. Files Created / Edited

**New**
- `src/pages/Workspace.tsx`
- `src/pages/workspace/Dashboard.tsx`
- `src/pages/workspace/DocsList.tsx`
- `src/pages/workspace/DocsEditor.tsx`
- `src/pages/workspace/SharedDocViewer.tsx`
- `src/pages/landing/WorkspacePage.tsx`
- `src/components/workspace/WorkspaceNav.tsx`
- `src/components/workspace/ModuleCard.tsx`
- `src/components/workspace/docs/EditorMenuBar.tsx`
- `src/components/workspace/docs/BubbleToolbar.tsx`
- `src/components/workspace/docs/IntelligenceTagExtension.ts`
- `src/components/workspace/docs/exporters.ts` (pdf/doc/json/csv)
- `src/components/workspace/docs/ShareDialog.tsx`
- `src/lib/workspace/documents.ts` (CRUD)
- `src/lib/workspace/modules.ts` (module registry)

**Edited**
- `src/App.tsx` (routes)
- `src/types/product.ts` (category includes `workspace`)
- `src/components/icons/ProductIcons.tsx` + `src/lib/products.ts` (icon)
- `src/data/products.ts` (Workspace product entry)

**Migration**
- One Supabase migration creating the 3 tables, the share-resolver function, and the `applications` row for `workspace`.

**Dependencies**
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` (table, image, link, underline, text-align, color, highlight, placeholder), `html2pdf.js`.

## 6. Out of Scope (deferred; cards remain Coming Soon)
- AG Sheets / Slides / Forms / Drive implementations.
- Real-time multi-user collaboration (Yjs) — versioning snapshots only for now.
- Form-style embedded view of a document (mentioned as future use).
