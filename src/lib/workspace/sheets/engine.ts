import { HyperFormula } from "hyperformula";
import type { Workbook, SheetPage } from "./documents";
import { parseCell } from "./documents";

/**
 * HyperFormula wrapper for Amineva Sheets.
 * Provides a single calc engine covering 400+ Excel-compatible functions:
 * math, statistical (AVERAGE, STDEV, VAR, CORREL, PERCENTILE, LINEST, FORECAST, TREND),
 * logical, lookup (VLOOKUP, INDEX, MATCH), text, date/time, financial (NPV, IRR, PMT, PV, FV),
 * engineering and information.
 */

export interface EngineHandle {
  hf: HyperFormula;
  sheetIds: Record<string, number>; // sheet name -> hf sheet id
  getCell: (sheetName: string, row: number, col: number) => any;
  setCell: (sheetName: string, row: number, col: number, raw: string) => void;
  getFormula: (sheetName: string, row: number, col: number) => string | null;
  destroy: () => void;
}

export function buildEngine(wb: Workbook): EngineHandle {
  const hf = HyperFormula.buildEmpty({
    licenseKey: "gpl-v3",
    useColumnIndex: true,
    smartRounding: true,
  });

  const sheetIds: Record<string, number> = {};
  const sheets = Array.isArray(wb?.sheets) ? wb.sheets : [];

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx];
    if (!sheet) continue;
    const sheetName = (sheet.name && sheet.name.trim()) ? sheet.name.trim() : `Sheet${sIdx + 1}`;

    try {
      let id: string;
      let actualKey = sheetName;
      try {
        id = hf.addSheet(sheetName);
      } catch {
        // Fallback for name collisions
        actualKey = `${sheetName}_${sIdx + 1}`;
        id = hf.addSheet(actualKey);
      }

      const idx = hf.getSheetId(id);
      if (idx == null) continue;
      sheetIds[actualKey] = idx;
      if (sheetIds[sheetName] === undefined) sheetIds[sheetName] = idx;

      // Determine bounds to construct a dense 2D matrix
      let maxRow = -1;
      let maxCol = -1;
      const cells = sheet.cells || {};

      for (const key of Object.keys(cells)) {
        const pos = parseCell(key);
        if (!pos) continue;
        if (pos.row > maxRow) maxRow = pos.row;
        if (pos.col > maxCol) maxCol = pos.col;
      }

      if (maxRow >= 0 && maxCol >= 0) {
        // Create dense 2D matrix filled with null to prevent sparse array undefined issues in HyperFormula
        const grid: any[][] = Array.from({ length: maxRow + 1 }, () => Array(maxCol + 1).fill(null));

        for (const [key, value] of Object.entries(cells)) {
          const pos = parseCell(key);
          if (!pos) continue;
          grid[pos.row][pos.col] = value ?? null;
        }

        try {
          hf.setSheetContent(idx, grid);
        } catch (err) {
          console.warn(`[buildEngine] Could not set content for sheet "${sheetName}":`, err);
        }
      }
    } catch (err) {
      console.warn(`[buildEngine] Error building engine sheet "${sheetName}":`, err);
    }
  }

  return {
    hf,
    sheetIds,
    getCell(name, row, col) {
      const id = sheetIds[name];
      if (id == null) return null;
      try {
        const v = hf.getCellValue({ sheet: id, row, col });
        if (v && typeof v === "object" && "type" in v) return `#${(v as any).type}!`;
        return v as any;
      } catch {
        return null;
      }
    },
    setCell(name, row, col, raw) {
      const id = sheetIds[name];
      if (id == null) return;
      let val: any = raw;
      if (raw === "") val = null;
      else if (!raw.startsWith("=") && !isNaN(Number(raw))) val = Number(raw);
      try {
        hf.setCellContents({ sheet: id, row, col }, [[val]]);
      } catch (err) {
        console.warn(`[buildEngine] setCell error at ${name} (${row}, ${col}):`, err);
      }
    },
    getFormula(name, row, col) {
      const id = sheetIds[name];
      if (id == null) return null;
      try {
        const f = hf.getCellFormula({ sheet: id, row, col });
        return f ?? null;
      } catch {
        return null;
      }
    },
    destroy() {
      try {
        hf.destroy();
      } catch {}
    },
  };
}

/** List of well-known functions grouped for the formula picker UI */
export const FUNCTION_CATEGORIES = {
  Statistical: ["AVERAGE","MEDIAN","MODE","STDEV","STDEVP","VAR","VARP","COUNT","COUNTA","COUNTIF","MAX","MIN","PERCENTILE","QUARTILE","CORREL","COVAR","SLOPE","INTERCEPT","FORECAST","TREND","LARGE","SMALL","RANK","GEOMEAN","HARMEAN","SKEW","KURT"],
  Math: ["SUM","SUMIF","SUMIFS","PRODUCT","ROUND","ROUNDUP","ROUNDDOWN","ABS","POWER","SQRT","EXP","LN","LOG","LOG10","MOD","INT","TRUNC","CEILING","FLOOR","RAND","RANDBETWEEN","PI"],
  Logical: ["IF","IFS","AND","OR","NOT","XOR","IFERROR","IFNA","SWITCH","TRUE","FALSE"],
  Lookup: ["VLOOKUP","HLOOKUP","INDEX","MATCH","OFFSET","INDIRECT","CHOOSE","ROWS","COLUMNS"],
  Text: ["CONCATENATE","CONCAT","TEXTJOIN","LEFT","RIGHT","MID","LEN","LOWER","UPPER","PROPER","TRIM","SUBSTITUTE","REPLACE","FIND","SEARCH","TEXT","VALUE"],
  DateTime: ["TODAY","NOW","DATE","DAY","MONTH","YEAR","HOUR","MINUTE","SECOND","WEEKDAY","EOMONTH","DATEDIF","NETWORKDAYS","WORKDAY"],
  Financial: ["NPV","IRR","PMT","PV","FV","RATE","NPER","IPMT","PPMT","SLN","SYD"],
  Engineering: ["BIN2DEC","DEC2BIN","HEX2DEC","DEC2HEX","BITAND","BITOR","BITXOR"],
  Information: ["ISBLANK","ISNUMBER","ISTEXT","ISERROR","ISNA","ISLOGICAL","N","NA","TYPE"],
} as const;
