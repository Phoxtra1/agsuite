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
  for (const sheet of wb.sheets) {
    const id = hf.addSheet(sheet.name);
    const idx = hf.getSheetId(id)!;
    sheetIds[sheet.name] = idx;
    // Determine size from cell ids
    const grid: any[][] = [];
    for (const [key, value] of Object.entries(sheet.cells)) {
      const pos = parseCell(key);
      if (!pos) continue;
      if (!grid[pos.row]) grid[pos.row] = [];
      grid[pos.row][pos.col] = value ?? null;
    }
    if (grid.length) hf.setSheetContent(idx, grid);
  }

  return {
    hf,
    sheetIds,
    getCell(name, row, col) {
      const id = sheetIds[name];
      if (id == null) return null;
      const v = hf.getCellValue({ sheet: id, row, col });
      if (v && typeof v === "object" && "type" in v) return `#${(v as any).type}!`;
      return v as any;
    },
    setCell(name, row, col, raw) {
      const id = sheetIds[name];
      if (id == null) return;
      let val: any = raw;
      if (raw === "") val = null;
      else if (!raw.startsWith("=") && !isNaN(Number(raw))) val = Number(raw);
      hf.setCellContents({ sheet: id, row, col }, [[val]]);
    },
    getFormula(name, row, col) {
      const id = sheetIds[name];
      if (id == null) return null;
      const f = hf.getCellFormula({ sheet: id, row, col });
      return f ?? null;
    },
    destroy() { hf.destroy(); },
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
