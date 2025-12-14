import type { Column, Row } from "@contracts";
import { useEffect, useRef } from "react";

type UseGridAutoInitParams = {
  autoCreateRow: boolean;
  autoFocusFirstCell: boolean;
  canEdit: boolean;
  draftRows: Row[];
  draftColumns: Column[];
  addRow: () => Promise<Row>;
  focusCell: (rowId: string, colId: string) => void;
};

export function useGridAutoInit({
  autoCreateRow,
  autoFocusFirstCell,
  canEdit,
  draftRows,
  draftColumns,
  addRow,
  focusCell,
}: UseGridAutoInitParams) {
  const didAutoInit = useRef(false);

  useEffect(() => {
    if (didAutoInit.current) return;
    if (!autoCreateRow || !autoFocusFirstCell) return;
    if (!canEdit) return;

    const firstCol = draftColumns[0];
    if (!firstCol) return;

    if (draftRows.length === 0) {
      didAutoInit.current = true;
      void addRow().then((row) => {
        queueMicrotask(() => focusCell(row.id, firstCol.id));
      });
      return;
    }

    const firstRow = draftRows[0];
    if (firstRow) {
      didAutoInit.current = true;
      queueMicrotask(() => focusCell(firstRow.id, firstCol.id));
    }
  }, [addRow, autoCreateRow, autoFocusFirstCell, canEdit, draftColumns, draftRows, focusCell]);
}
