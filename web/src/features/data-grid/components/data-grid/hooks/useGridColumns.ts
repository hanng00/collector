import { newColumnDraft, normalizeColumnsForSave } from "@/features/data-grid/domain/columns";
import type { Column } from "@contracts";
import { useCallback, useEffect, useRef, useState } from "react";

type UseGridColumnsParams = {
  initialColumns: Column[];
  workspaceId: string;
  canEditSchema: boolean;
  onPutColumns?: (columns: Column[]) => Promise<unknown>;
};

export function useGridColumns({
  initialColumns,
  workspaceId,
  canEditSchema,
  onPutColumns,
}: UseGridColumnsParams) {
  const [draftColumns, setDraftColumns] = useState<Column[]>(initialColumns);
  useEffect(() => {
    setDraftColumns(initialColumns);
  }, [initialColumns]);

  const saveColumnsTimer = useRef<number | null>(null);
  const scheduleSaveColumns = useCallback(
    (next: Column[]) => {
      if (!canEditSchema) return;
      if (!onPutColumns) return;
      if (saveColumnsTimer.current) window.clearTimeout(saveColumnsTimer.current);
      saveColumnsTimer.current = window.setTimeout(async () => {
        try {
          const normalized = normalizeColumnsForSave({ workspaceId, columns: next });
          await onPutColumns(normalized);
        } catch (error) {
          // Skip save if validation fails (e.g., missing descriptions) or API error occurs.
          console.warn("Skipping column save:", error instanceof Error ? error.message : error);
        }
      }, 500);
    },
    [canEditSchema, onPutColumns, workspaceId]
  );

  const updateColumn = useCallback(
    (colId: string, patch: Partial<Column>) => {
      setDraftColumns((prev) => {
        const next = prev.map((c) => (c.id === colId ? { ...c, ...patch } : c));
        scheduleSaveColumns(next);
        return next;
      });
    },
    [scheduleSaveColumns]
  );

  const addColumn = useCallback(() => {
    if (!canEditSchema) return;
    setDraftColumns((prev) => {
      const next = [...prev, newColumnDraft({ workspaceId, order: prev.length + 1 })];
      scheduleSaveColumns(next);
      return next;
    });
  }, [canEditSchema, scheduleSaveColumns, workspaceId]);

  return {
    draftColumns,
    updateColumn,
    addColumn,
  };
}
