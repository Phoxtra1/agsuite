# Amineva Docs — Advanced Workspace Upgrade

## Scope
Upgrade the existing AG Docs system in-place. No new product, no schema changes (existing `workspace_documents`, `workspace_document_versions`, `workspace_document_shares`, `workspace_document_comments` tables stay as-is).

## 1. Branding sweep: AG Docs → Amineva Docs
Find/replace across:
- `src/components/workspace/WorkspaceNav.tsx`
- `src/components/workspace/docs/*` (DocHeader, AGIntelligencePanel → AmnivaIntelligencePanel rename, all toolbar labels)
- `src/pages/workspace/Dashboard.tsx`, `DocsList.tsx`, `DocsEditor.tsx`, `SharedDocViewer.tsx`
- `src/pages/landing/WorkspacePage.tsx`
- `src/lib/workspace/modules.ts`
- `src/types/product.ts` (workspace category copy)
- Module names: Amineva Docs / Sheets / Slides / Forms / Drive

Rename component file `AGIntelligencePanel.tsx` → `AmnivaIntelligencePanel.tsx` and update imports. Rename internal label "AG Intelligence" → "Amineva Intelligence".

## 2. Force light theme inside the Docs editor (sticky default)
- On first mount of `DocsEditor.tsx` page, if `localStorage.amineva_theme` is unset, set it to `"light"` via `setTheme("light")`. Respects user override afterward.
- Add a small editor-scoped class on the editor shell so the document canvas stays paper-white even if user later flips global theme (canvas only — chrome follows theme).

## 3. DocsList portrait document cards
Rewrite `src/pages/workspace/DocsList.tsx` cards:
- Aspect ratio ~ `3/4` (portrait page mini-preview)
- Top 70%: white "paper" preview rendering `content_text` first ~6 lines in tiny serif, with faux page lines
- Bottom strip: title (bold, 1 line), last-updated date, doc type badge ("Document"), quick-action icons (open, rename, duplicate, share, delete) revealed on hover
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`
- "+ New Document" primary button stays top-right; also a portrait "ghost card" tile that creates a new doc

## 4. Editor shell rebuild — `DocsEditor.tsx` page
New layout (CSS grid):
```
+----------------------------------------------------+
| DocHeader (breadcrumb, title, save status, share) |
+----------------------------------------------------+
| Ribbon Tabs: Home Insert PageLayout References    |
|              Review View                           |
+----------------------------------------------------+
| Ribbon Toolbar (contextual to active tab)         |
+----+------------------------------------+---------+
|Left| Page Canvas (paper, margins,       | Right   |
|Nav | header/footer, page numbers)       | Intel   |
+----+------------------------------------+---------+
| StatusBar (words/chars/pages/zoom)                 |
+----------------------------------------------------+
```

### 4a. Left Navigation Panel (new)
File: `src/components/workspace/docs/LeftDocPanel.tsx`
- Collapsible (chevron toggle, animates width 280px ↔ 56px)
- Sections: "+ New Document" primary button, "Recent" (last 8 from `listDocuments`), "All Documents" (scrollable), inline rename, delete confirm
- Clicking item navigates `/workspace/docs/:id`

### 4b. Ribbon system (new)
File: `src/components/workspace/docs/Ribbon.tsx` plus per-tab files in `src/components/workspace/docs/ribbon/`:
- `HomeTab.tsx` — Clipboard (Cut/Copy/Paste via `document.execCommand` + editor APIs), Font (family dropdown, size +/-, B/I/U/Strike, color, highlight), Change Case (transforms selected text via editor.chain), Paragraph (lists, indent, alignment, line spacing, borders, shading), Styles (Normal/H1-H3/Title/Subtitle)
- `InsertTab.tsx` — Blank page, Page break, Table (grid picker popover for rows×cols up to 10×10), Merge/Split cells, Image upload (file input → base64 → `editor.chain().setImage`), Links (dialog), Symbols (popover), Shapes/Text boxes (insert as styled divs via custom node — minimal version: insert blockquote placeholder)
- `PageLayoutTab.tsx` — Margins (Narrow/Normal/Wide/Custom), Orientation (Portrait/Landscape), Page Size (A3/A4/A5/A6/Letter/Legal/Tabloid/Statement/Custom), Columns (1/2/3), Watermark (text input → CSS), Page borders, Line numbers (toggle CSS counter)
- `ReferencesTab.tsx` — TOC generator (scans headings, inserts list at cursor), Footnotes (custom mark — minimal: superscript number + bottom list), Captions (insert formatted caption paragraph), Index/Mark entry (stub with toast), Citation tools (stub)
- `ReviewTab.tsx` — Word/char count (live from `editor.storage.characterCount`), Grammar/Spelling AI (calls `docs-intelligence` with action `grammar`), Translation (action `translate`), Thesaurus (action `synonyms`), Comments (toggle right panel comments tab), Track changes (toggle CSS marking new content), Accept/Reject/Prev/Next change, Permissions (Restrict/Allow comments/View only — local state for now)
- `ViewTab.tsx` — Modes (Reading/Print Layout/Web Layout/Outline), toggles for Navigation panel, Outline, Gridlines, Ruler, Guides, Split window (stub), Zoom in/out/Full page/Page width

Each tab uses a horizontal scroll-safe flex with grouped sections separated by vertical dividers.

### 4c. Page Canvas
File: `src/components/workspace/docs/PageCanvas.tsx`
- Wraps `<EditorContent>` in a "paper" container with configurable `pageSize`, `orientation`, `margins`, `columns`
- Renders editable header band, editable footer band, page number token
- Background `bg-white text-gray-900` (canvas stays light always), `shadow-lg`, centered with adjustable zoom transform
- Page break visualization: CSS striped divider every Nth content height

State held in `DocsEditor.tsx` via a `pageSettings` object persisted into `workspace_documents.outline` JSON (already exists) under key `__page__`.

### 4d. Right Intelligence Panel
Replace `AGIntelligencePanel.tsx` with `AmnivaIntelligencePanel.tsx`:
- Same tabs (Intelligence / Templates / Analyzer / Classification)
- Collapsible: chevron on left edge toggles between full 320px and 0px (icon rail with 40px stays visible to re-expand)
- Wire each action button to the existing `docs-intelligence` edge function via supabase.functions.invoke — replace nothing currently functional, just connect the unwired buttons. Apply AI output back into editor via `editor.chain().focus().insertContent(result)` or replace selection.
- Templates: predefined TipTap JSON → `editor.commands.setContent` + autosave
- Analyzer: call edge function with action `analyze`, display returned score/metrics
- Classification: tag click writes to `workspace_documents.classification`

## 5. Persistence
- Autosave (existing 800ms debounce) extended to also write `pageSettings` and `classification`
- Title edits in DocHeader save via `updateDocument`
- Document type column derived from settings (default "Document")

## 6. Out of scope
- Real-time multi-user cursors (Yjs)
- Native PDF print engine (use existing html2pdf)
- True column reflow across pages (CSS columns only)
- Full grammar engine (AI-based via edge function only)
- Shapes/text boxes as draggable canvas objects (simple inserted blocks only)

## Files
**New**
- `src/components/workspace/docs/LeftDocPanel.tsx`
- `src/components/workspace/docs/Ribbon.tsx`
- `src/components/workspace/docs/ribbon/HomeTab.tsx`
- `src/components/workspace/docs/ribbon/InsertTab.tsx`
- `src/components/workspace/docs/ribbon/PageLayoutTab.tsx`
- `src/components/workspace/docs/ribbon/ReferencesTab.tsx`
- `src/components/workspace/docs/ribbon/ReviewTab.tsx`
- `src/components/workspace/docs/ribbon/ViewTab.tsx`
- `src/components/workspace/docs/PageCanvas.tsx`
- `src/components/workspace/docs/AmnivaIntelligencePanel.tsx`

**Edited**
- `src/pages/workspace/DocsEditor.tsx` (full layout rebuild)
- `src/pages/workspace/DocsList.tsx` (portrait cards)
- `src/pages/workspace/Dashboard.tsx` (branding)
- `src/components/workspace/WorkspaceNav.tsx` (branding + module list)
- `src/components/workspace/docs/DocHeader.tsx` (branding)
- `src/components/workspace/docs/MainToolbar.tsx` (deprecated — replaced by Ribbon; keep file but unused, or delete)
- `src/lib/workspace/modules.ts` (Amineva naming)
- `src/types/product.ts` (workspace copy)
- `src/pages/landing/WorkspacePage.tsx` (copy)
- `src/index.css` (paper canvas + ribbon styles)

**Deleted**
- `src/components/workspace/docs/AGIntelligencePanel.tsx` (replaced)
