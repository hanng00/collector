import { useCallback, useEffect, useRef, useState } from "react";

function makeCellKey(rowId: string, colId: string) {
  return `${rowId}::${colId}`;
}

type CellCoord = { rowId: string; colId: string };
type EditingCoord = CellCoord & { selectOnFocus: boolean };

function canSelectText(
  el: HTMLElement
): el is HTMLInputElement | HTMLTextAreaElement {
  return (
    (el instanceof HTMLInputElement && typeof el.select === "function") ||
    (el instanceof HTMLTextAreaElement && typeof el.select === "function")
  );
}

export function useGridCellFocus() {
  const [selected, setSelected] = useState<CellCoord | null>(null);
  const [editing, setEditing] = useState<EditingCoord | null>(null);

  const editorRefs = useRef(new Map<string, HTMLElement | null>());
  const cellRefs = useRef(new Map<string, HTMLDivElement | null>());
  const headerRefs = useRef(new Map<string, HTMLTableCellElement | null>());

  const setHeaderRef = useCallback((colId: string) => {
    return (el: HTMLTableCellElement | null) => {
      if (el) headerRefs.current.set(colId, el);
      else headerRefs.current.delete(colId);
    };
  }, []);

  const focusSelectedCell = useCallback((rowId: string, colId: string) => {
    const key = makeCellKey(rowId, colId);
    const el = cellRefs.current.get(key);
    if (el) el.focus();
  }, []);

  // Focus is an imperative DOM side-effect. React won't automatically focus the
  // "right" element after state changes, so we do it here after commit.
  // Prefer useEffect over useLayoutEffect since we aren't measuring layout.
  useEffect(() => {
    if (editing) {
      const key = makeCellKey(editing.rowId, editing.colId);
      const editorEl = editorRefs.current.get(key);
      if (editorEl) {
        editorEl.focus();
        if (editing.selectOnFocus && canSelectText(editorEl)) editorEl.select();
        return;
      }
      // Input might not be mounted yet; keep the cell focused at least.
      focusSelectedCell(editing.rowId, editing.colId);
      return;
    }
    if (selected) {
      focusSelectedCell(selected.rowId, selected.colId);
    }
  }, [editing, focusSelectedCell, selected]);

  const selectCell = useCallback(
    (rowId: string, colId: string) => {
      // Idempotent: clicking the already-selected cell should not churn state.
      // If we're editing, selection changes are handled elsewhere.
      if (
        selected &&
        selected.rowId === rowId &&
        selected.colId === colId &&
        editing === null
      ) {
        return;
      }
      const next = { rowId, colId };
      setSelected(next);
      // Selecting a new cell exits edit mode.
      setEditing(null);
    },
    [editing, selected]
  );

  const beginEdit = useCallback(
    (rowId: string, colId: string, opts?: { select?: boolean }) => {
      // Idempotent: if we are already editing this cell, don't churn state.
      if (editing && editing.rowId === rowId && editing.colId === colId) {
        return;
      }
      const shouldSelect = opts?.select ?? true;
      const next = { rowId, colId };
      setSelected(next);
      setEditing({ ...next, selectOnFocus: shouldSelect });
    },
    [editing]
  );

  const endEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const setInputRef = useCallback(
    (rowId: string, colId: string, el: HTMLElement | null) => {
      const key = makeCellKey(rowId, colId);
      if (el) editorRefs.current.set(key, el);
      else editorRefs.current.delete(key);
    },
    []
  );

  const setCellRef = useCallback(
    (rowId: string, colId: string, el: HTMLDivElement | null) => {
      const key = makeCellKey(rowId, colId);
      if (el) cellRefs.current.set(key, el);
      else cellRefs.current.delete(key);
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    setEditing(null);
    // Imperatively blur whatever is currently focused (cell/editor).
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, []);

  return {
    selected,
    editing,
    selectCell,
    beginEdit,
    endEdit,
    clearSelection,
    setInputRef,
    setCellRef,
    headerRefs,
    setHeaderRef,
  };
}
