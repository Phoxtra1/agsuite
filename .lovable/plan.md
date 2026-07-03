# Plan: Amineva Sheets + Amineva Docs fixes

Two coordinated deliverables. Docs fixes are quick; Sheets is a new intelligence-grade module. Everything is frontend/presentation plus one new DB table for sheet documents.

---

## Part A — Amineva Docs fixes

Files: `src/components/workspace/docs/PageCanvas.tsx`, `DocEditor.tsx`, `src/pages/workspace/DocsEditor.tsx`, `src/pages/workspace/SharedDocViewer.tsx`, `src/index.css`.

1. **True page breaks + one page number per page**
   - Replace the current single scrolling canvas with a real multi-page renderer:
     - Measure editor content height after each update; split into fixed-height page frames based on `PageSettings.size` (A4/Letter/Legal) minus margins, header, footer.
     - Each page is its own white `<div class="doc-page">` with the same margins, header, and footer. Only the last page shows a partial fill; content flows into the next page frame.
     - Page footer renders `Page {n} of {total}` exactly once per page (respecting `pageSettings.footer` format, e.g. `Page X of Y`, `X / Y`, or user template).
   - Remove the current ad-hoc page-number injection that produces duplicated / haphazard numbers.
   - Print CSS: `@page { size: A4; margin: 0 }` + `.doc-page { break-after: page }` so print and PDF export match on-screen pagination exactly.

2. **Share view matches the doc editor page format**
   - `SharedDocViewer.tsx` currently renders a full-screen editor. Replace its surface with the same `PageCanvas` component in read-only (or edit, based on share mode) so the shared link opens as paginated white pages with header/footer/page numbers — identical to the creation view, minus the ribbon/side panels.
   - Keep a minimal top bar (title, mode badge, download).

3. **Default white page background**
   - Force `.doc-page { background: #ffffff; color: #111827 }` regardless of theme (dark mode only affects chrome around the page, not the page itself).
   - Remove the "force light theme on first entry" localStorage hack — page whiteness is now guaranteed by the page component itself.

---

## Part B — Amineva Sheets (new Workspace module)

Intelligence-grade spreadsheet. Not a toy grid. Built on **HyperFormula** (open-source, MIT, 400+ functions incl. statistical, financial, engineering, lookup, text, date, logical) as the calc engine, wrapped in our own virtualized grid so we control the look, keyboard model, and intelligence layer.

### New route
- `/workspace/sheets` → list of sheet documents
- `/workspace/sheets/:id` → editor
- Register in `src/pages/Workspace.tsx` and flip `amineva-sheets` in `src/lib/workspace/modules.ts` to `active`.

### New files
```
src/pages/workspace/SheetsList.tsx
src/pages/workspace/SheetsEditor.tsx
src/components/workspace/sheets/SheetGrid.tsx          // virtualized grid (react-window)
src/components/workspace/sheets/SheetRibbon.tsx        // Home / Insert / Formulas / Data / Analyze / View
src/components/workspace/sheets/FormulaBar.tsx
src/components/workspace/sheets/SheetTabs.tsx          // multi-sheet tabs
src/components/workspace/sheets/AmnivaAnalysisPanel.tsx// right-side intelligence panel
src/components/workspace/sheets/ChartPanel.tsx         // recharts-based
src/components/workspace/sheets/exporters.ts           // CSV / XLSX (SheetJS) / JSON / PDF
src/lib/workspace/sheets/engine.ts                     // HyperFormula wrapper
src/lib/workspace/sheets/stats.ts                      // SPSS-style analyses
src/lib/workspace/sheets/documents.ts                  // CRUD against workspace_sheets
supabase/functions/sheets-intelligence/index.ts        // Lovable AI: explain data, suggest chart, generate formula
```

### Core spreadsheet features
- **Grid**: virtualized (react-window) up to 10k rows × 100 cols, freeze rows/cols, resize, merge cells, cell + range selection, keyboard navigation (arrows, Tab, Enter, Shift-select, Ctrl+C/V/X/Z/Y), fill-handle drag, autofill patterns.
- **Formatting**: font, size, bold/italic/underline, color, fill, alignment, wrap, borders, number formats (general, number, currency, percent, date, time, scientific, custom), conditional formatting (color scales, data bars, highlight rules).
- **Multi-sheet workbook** with tabs, rename/reorder/duplicate/delete.
- **Named ranges**, **data validation** (list/number/date), **filter & sort**, **find & replace**, **freeze panes**, **hide/show rows/cols**.
- **Import/Export**: CSV, XLSX (via SheetJS `xlsx`), JSON, PDF (via html2canvas + jsPDF, same pattern as Docs).

### Formulas (via HyperFormula, all built-in)
Math, statistical (AVERAGE, MEDIAN, MODE, STDEV, VAR, PERCENTILE, QUARTILE, CORREL, COVAR, SLOPE, INTERCEPT, FORECAST, TREND, LINEST), logical (IF, IFS, AND, OR, NOT, SWITCH), lookup (VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP), text (CONCAT, TEXTJOIN, LEFT/RIGHT/MID, REGEX*), date/time, financial (NPV, IRR, PMT, FV, PV), engineering, information. Formula bar with autocomplete, argument hints, and syntax highlighting.

### Amineva Analysis Panel (the SPSS-style differentiator)
Right-side panel driven by the current selection / active range:

1. **Descriptive statistics** — n, mean, median, mode, min, max, range, variance, SD, SE, skewness, kurtosis, quartiles, IQR, sum.
2. **Frequency table** with counts, percent, cumulative percent.
3. **Correlation matrix** (Pearson + Spearman) across selected columns, with heatmap.
4. **Linear regression** (simple + multiple): coefficients, R², adj-R², SE, t-stat, p-value, residual plot.
5. **T-tests**: one-sample, independent two-sample, paired.
6. **ANOVA** (one-way).
7. **Chi-square** test of independence.
8. **Cross-tabulation** with row/col %.
9. **Outlier detection** (IQR + z-score).
10. **Normality**: Shapiro-Wilk approximation + Q-Q plot.
11. **Cluster preview**: k-means (k selectable) for numeric columns.
12. **Time-series basics**: moving average, exponential smoothing, seasonal decomposition (additive).
13. **Pivot table builder** (rows / cols / values / aggregator).
14. **Charts**: column, bar, line, area, scatter, pie, histogram, boxplot, heatmap — all recharts based, insertable into the sheet as embedded objects.

All analyses run client-side in `stats.ts` (pure TS, no server calls) and can be exported as a "Report" block into an Amineva Doc.

### Amineva Intelligence (AI-assisted, edge function)
`sheets-intelligence` edge function (Lovable AI Gateway, no key needed):
- **Explain this range** — natural-language summary of the selection.
- **Suggest chart** — returns chart type + fields.
- **Generate formula** — user describes intent, model returns formula string validated against HyperFormula.
- **Detect anomalies** — flags rows.
- **Data cleanup suggestions** — trim, type coercion, deduplication.

### Storage (one migration)
Table `workspace_sheets`:
- `id`, `user_id`, `title`, `workbook_json` (jsonb — full multi-sheet workbook: sheets, cells, formats, named ranges, charts), `content_text` (searchable flatten), `created_at`, `updated_at`.
- RLS: owner-only (`auth.uid() = user_id`), plus optional `workspace_sheet_shares` mirror of the Docs share pattern (token, mode, expires_at) with `get_shared_sheet` / `update_shared_sheet` security-definer functions.
- Standard GRANTs (authenticated + service_role).

### Look & feel
- Matches Docs chrome: same header (breadcrumb, autosave state, Export, Share), same left panel (documents list → sheets list), same right intelligence panel style.
- White grid background by default (same rule as Docs page).
- Semantic tokens only.

### Dependencies to add
`hyperformula`, `xlsx` (SheetJS community), `react-window`. Recharts, html2canvas, jsPDF already present.

---

## Technical notes
- Pagination measurement uses a hidden mirror div at page-content width; on each editor update we walk block nodes and pack them into page frames. Debounced to avoid layout thrash.
- Share viewer becomes a thin wrapper: `PageCanvas` in read-only mode for `mode='view'`, editable for `mode='edit'` (reusing existing `update_shared_document` RPC).
- HyperFormula runs in a Web Worker for sheets > 5k populated cells to keep the UI responsive.
- Sheets autosave uses the same 800ms debounce + 30s version snapshot pattern as Docs.

---

## Out of scope (ask before adding)
- Real-time multi-cursor collaboration on sheets.
- Google Sheets / Excel Online live sync.
- Server-side scheduled recomputation.