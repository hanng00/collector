import type { Column, Row } from "@contracts";

export type GridCoord = {
  rowIndex: number;
  colIndex: number;
};

export type ClipboardMatrix = string[][];

export function parseClipboardText(text: string): ClipboardMatrix {
  // Accept TSV (Sheets/Excel) and basic CSV-ish; default is tab/newline.
  const normalized = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const lines = normalized
    .split("\n")
    // allow trailing newline without adding empty row
    .filter((_, idx, arr) => !(idx === arr.length - 1 && arr[idx] === ""));

  return lines.map((line) => line.split("\t"));
}

export function clampCoord(coord: GridCoord, maxRows: number, maxCols: number): GridCoord {
  return {
    rowIndex: Math.max(0, Math.min(maxRows - 1, coord.rowIndex)),
    colIndex: Math.max(0, Math.min(maxCols - 1, coord.colIndex)),
  };
}

export function ensureAllColumnValues(values: Row["values"], columns: Column[]): Row["values"] {
  const next: Row["values"] = { ...values };
  for (const c of columns) {
    if (!(c.id in next)) next[c.id] = null;
  }
  return next;
}

export function coerceCellValue(column: Column, raw: string): Row["values"][string] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // v1: treat formulas as plain strings (e.g. "=SUM(A1:A3)")
  // Later: upgrade to a real formula engine + persistence.
  if (trimmed.startsWith("=")) return trimmed;

  switch (column.type) {
    case "number": {
      const n = Number(trimmed.replaceAll(",", ""));
      return Number.isFinite(n) ? n : null;
    }
    case "money": {
      const n = Number(trimmed.replaceAll(/[^0-9.\-]/g, ""));
      return Number.isFinite(n) ? n : trimmed;
    }
    case "date": {
      // store as YYYY-MM-DD when possible
      const d = new Date(trimmed);
      return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : trimmed;
    }
    case "attachment":
      return null;
    case "enum": {
      // Keep as string; best-effort normalize to an existing enum value.
      const s = trimmed;
      if (!column.enumValues?.length) return s;
      const norm = normalizeEnum(s);
      const found = column.enumValues.find((v) => normalizeEnum(v) === norm);
      return found ?? s;
    }
    default:
      return trimmed;
  }
}

function normalizeEnum(v: string): string {
  return v.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

export function toDisplayValue(v: Row["values"][string]): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return "";
}

export type ApplyPasteResult = {
  nextRows: Row[];
  changedRowIds: string[];
  createdRowIds: string[];
};

/**
 * Apply a matrix of clipboard values to rows starting at `start`, spanning dynamic columns.
 * `dataColumns` is the ordered list of data columns (no status/action columns).
 */
export function applyClipboardMatrix(params: {
  rows: Row[];
  dataColumns: Column[];
  start: GridCoord;
  matrix: ClipboardMatrix;
  createEmptyRow: () => Row;
}): ApplyPasteResult {
  const { rows, dataColumns, start, matrix, createEmptyRow } = params;

  const nextRows = [...rows];
  const changedRowIds = new Set<string>();
  const createdRowIds: string[] = [];

  for (let r = 0; r < matrix.length; r++) {
    const targetRowIndex = start.rowIndex + r;
    while (nextRows.length <= targetRowIndex) {
      const created = createEmptyRow();
      nextRows.push(created);
      createdRowIds.push(created.id);
    }

    const row = nextRows[targetRowIndex]!;
    const nextValues: Row["values"] = { ...row.values };

    for (let c = 0; c < matrix[r]!.length; c++) {
      const targetColIndex = start.colIndex + c;
      const column = dataColumns[targetColIndex];
      if (!column) continue;
      const raw = matrix[r]![c] ?? "";
      nextValues[column.id] = coerceCellValue(column, raw);
    }

    nextRows[targetRowIndex] = {
      ...row,
      values: nextValues,
      updatedAt: new Date().toISOString(),
    };
    changedRowIds.add(row.id);
  }

  return { nextRows, changedRowIds: [...changedRowIds], createdRowIds };
}

