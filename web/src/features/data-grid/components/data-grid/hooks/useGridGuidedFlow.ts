import type { Column } from "@contracts";
import { useCallback, useEffect, useMemo, useState } from "react";

type GuidedFlowWindow = Window & {
  __startGuidedFlow?: (() => void) | undefined;
};

type UseGridGuidedFlowParams = {
  draftColumns: Column[];
  headerRefs: React.MutableRefObject<Map<string, HTMLTableCellElement | null>>;
  updateColumn: (colId: string, patch: Partial<Column>) => void;
  onStartGuidedFlow?: () => void;
};

export function useGridGuidedFlow({
  draftColumns,
  headerRefs,
  updateColumn,
  onStartGuidedFlow,
}: UseGridGuidedFlowParams) {
  const [guidedColumnId, setGuidedColumnId] = useState<string | null>(null);

  const columnsMissingDescriptions = useMemo(
    () => draftColumns.filter((c) => !c.description || c.description.trim().length === 0),
    [draftColumns]
  );

  const startGuidedFlow = useCallback(() => {
    if (columnsMissingDescriptions.length === 0) return;
    const first = columnsMissingDescriptions[0];
    if (!first) return;
    setGuidedColumnId(first.id);
    // Scroll header into view.
    queueMicrotask(() => {
      const headerEl = headerRefs.current.get(first.id);
      if (headerEl) {
        headerEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    });
  }, [columnsMissingDescriptions, headerRefs]);

  const handleGuidedDescriptionChange = useCallback(
    (colId: string, description: string) => {
      updateColumn(colId, { description });
      // If this was the guided column and description is now filled, move to next.
      if (guidedColumnId === colId && description.trim().length > 0) {
        const currentIndex = columnsMissingDescriptions.findIndex((c) => c.id === colId);
        const next = columnsMissingDescriptions[currentIndex + 1];
        if (next) {
          setGuidedColumnId(next.id);
          queueMicrotask(() => {
            const headerEl = headerRefs.current.get(next.id);
            if (headerEl) {
              headerEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
          });
        } else {
          setGuidedColumnId(null);
        }
      }
    },
    [columnsMissingDescriptions, guidedColumnId, updateColumn, headerRefs]
  );

  // Expose guided flow start to parent via callback ref pattern.
  useEffect(() => {
    if (onStartGuidedFlow) {
      (window as GuidedFlowWindow).__startGuidedFlow = startGuidedFlow;
    }
    return () => {
      delete (window as GuidedFlowWindow).__startGuidedFlow;
    };
  }, [onStartGuidedFlow, startGuidedFlow]);

  return {
    guidedColumnId,
    columnsMissingDescriptions,
    handleGuidedDescriptionChange,
  };
}
