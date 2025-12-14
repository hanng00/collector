import { coerceCellValue, ensureAllColumnValues } from "@/features/data-grid/domain/grid";
import type { Column, Row } from "@contracts";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UseGridRowsParams = {
  initialRows: Row[];
  columns: Column[];
  workspaceId: string;
  contributorLinkId?: string;
  canEdit: boolean;
  onUpsertRow?: (args: {
    workspaceId: string;
    rowId: string;
    row: {
      values: Row["values"];
      status: Row["status"];
      linkId?: string;
      createdByLinkId?: string;
    };
  }) => Promise<unknown>;
};

export function useGridRows({
  initialRows,
  columns,
  workspaceId,
  contributorLinkId,
  canEdit,
  onUpsertRow,
}: UseGridRowsParams) {
  // Sync draft rows with incoming props (simplified - no redundant state)
  const [draftRows, setDraftRows] = useState<Row[]>(initialRows);
  useEffect(() => {
    setDraftRows(initialRows);
  }, [initialRows]);

  const createEmptyRow = useCallback((): Row => {
    const id = `row-${crypto.randomUUID()}`;
    const values: Row["values"] = Object.fromEntries(columns.map((c) => [c.id, null]));
    const now = new Date().toISOString();
    return {
      id,
      workspaceId,
      linkId: contributorLinkId,
      createdByLinkId: contributorLinkId,
      values,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
  }, [contributorLinkId, columns, workspaceId]);

  const persistRow = useCallback(
    async (row: Row) => {
      if (!canEdit) return;
      if (!onUpsertRow) return;
      const values = ensureAllColumnValues(row.values, columns);
      try {
        await onUpsertRow({
          workspaceId,
          rowId: row.id,
          row: {
            values,
            status: row.status,
            linkId: contributorLinkId ?? row.linkId,
            createdByLinkId: row.createdByLinkId ?? contributorLinkId,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to save row", { workspaceId, rowId: row.id, error });
        toast.error("Couldn't save changes", { description: message });
      }
    },
    [canEdit, contributorLinkId, columns, onUpsertRow, workspaceId]
  );

  const updateCell = useCallback(
    (rowId: string, colId: string, raw: string) => {
      const column = columns.find((c) => c.id === colId);
      const coerced = column ? coerceCellValue(column, raw) : raw;
      setDraftRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                values: { ...r.values, [colId]: coerced },
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
    },
    [columns]
  );

  const setRowStatus = useCallback((rowId: string, status: Row["status"]) => {
    setDraftRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, status } : r)));
  }, []);

  const addRow = useCallback(async () => {
    const row = createEmptyRow();
    setDraftRows((prev) => [...prev, row]);
    if (canEdit) {
      await persistRow(row);
    }
    return row;
  }, [canEdit, createEmptyRow, persistRow]);

  const saveRowById = useCallback(
    async (rowId: string) => {
      const row = draftRows.find((r) => r.id === rowId);
      if (!row) return;
      await persistRow(row);
    },
    [draftRows, persistRow]
  );

  const updateRows = useCallback((updater: (prev: Row[]) => Row[]) => {
    setDraftRows(updater);
  }, []);

  return {
    draftRows,
    createEmptyRow,
    updateCell,
    setRowStatus,
    addRow,
    saveRowById,
    updateRows,
    persistRow,
  };
}
