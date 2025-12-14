import {
    applyClipboardMatrix,
    parseClipboardText,
    type GridCoord,
} from "@/features/data-grid/domain/grid";
import type { Column, Row } from "@contracts";
import { useCallback } from "react";

type UseGridClipboardParams = {
  draftRows: Row[];
  draftColumns: Column[];
  canEdit: boolean;
  createEmptyRow: () => Row;
  persistRow: (row: Row) => Promise<void>;
};

export function useGridClipboard({
  draftRows,
  draftColumns,
  canEdit,
  createEmptyRow,
  persistRow,
}: UseGridClipboardParams) {
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLInputElement>, start: GridCoord): Promise<Row[]> => {
      const text = e.clipboardData.getData("text/plain");
      if (!text) return draftRows;
      e.preventDefault();

      const matrix = parseClipboardText(text);
      const res = applyClipboardMatrix({
        rows: draftRows,
        dataColumns: draftColumns,
        start,
        matrix,
        createEmptyRow,
      });

      if (!canEdit) return res.nextRows;

      // Persist per-row (one request per row) for correctness.
      const changed = res.nextRows.filter((r) => res.changedRowIds.includes(r.id));
      for (const row of changed) {
        await persistRow(row);
      }

      return res.nextRows;
    },
    [canEdit, createEmptyRow, draftColumns, draftRows, persistRow]
  );

  return { handlePaste };
}
