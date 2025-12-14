"use client";

import { Button } from "@/components/ui/button";
import { newColumnDraft, normalizeColumnsForSave } from "@/features/data-grid/domain/columns";
import {
    applyClipboardMatrix,
    coerceCellValue,
    ensureAllColumnValues,
    parseClipboardText,
    type GridCoord,
} from "@/features/data-grid/domain/grid";
import type { Column, Row } from "@contracts";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GridDataCell } from "./GridDataCell";
import { GridHeaderCell } from "./GridHeaderCell";
import { GridStatusCell } from "./GridStatusCell";
import type { DataGridProps } from "./types";

function makeCellKey(rowId: string, colId: string) {
  return `${rowId}::${colId}`;
}

export function DataGrid({
  workspaceId,
  columns,
  rows,
  contributorLinkId,
  canEdit = true,
  canEditSchema = false,
  autoCreateRow = false,
  autoFocusFirstCell = false,
  onUploaded,
  onStartGuidedFlow,
  ports,
}: DataGridProps) {
  const dataColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    [rows]
  );

  // Local drafts for responsive editing.
  const [draftRows, setDraftRows] = useState<Row[]>(sortedRows);
  const [draftColumns, setDraftColumns] = useState<Column[]>(dataColumns);

  useEffect(() => setDraftRows(sortedRows), [sortedRows]);
  useEffect(() => setDraftColumns(dataColumns), [dataColumns]);

  const [active, setActive] = useState<{ rowId: string; colId: string } | null>(null);
  const inputRefs = useRef(new Map<string, HTMLInputElement | null>());
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [guidedColumnId, setGuidedColumnId] = useState<string | null>(null);
  const headerRefs = useRef(new Map<string, HTMLTableCellElement | null>());

  const setHeaderRef = useCallback((colId: string) => {
    return (el: HTMLTableCellElement | null) => {
      headerRefs.current.set(colId, el);
    };
  }, []);

  const focusCell = useCallback((rowId: string, colId: string) => {
    const key = makeCellKey(rowId, colId);
    const el = inputRefs.current.get(key);
    if (el) {
      el.focus();
      el.select();
      setActive({ rowId, colId });
    }
  }, []);

  const createEmptyRow = useCallback((): Row => {
    const id = `row-${crypto.randomUUID()}`;
    const values: Row["values"] = Object.fromEntries(draftColumns.map((c) => [c.id, null]));
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
  }, [contributorLinkId, draftColumns, workspaceId]);

  const persistRow = useCallback(
    async (row: Row) => {
      if (!canEdit) return;
      if (!ports?.onUpsertRow) return;
      const values = ensureAllColumnValues(row.values, draftColumns);
      await ports.onUpsertRow({
        workspaceId,
        rowId: row.id,
        row: {
          values,
          status: row.status,
          linkId: contributorLinkId ?? row.linkId,
          createdByLinkId: row.createdByLinkId ?? contributorLinkId,
        },
      });
    },
    [canEdit, contributorLinkId, draftColumns, ports, workspaceId]
  );

  const addRow = useCallback(async () => {
    const row = createEmptyRow();
    setDraftRows((prev) => [...prev, row]);
    if (canEdit) {
      await persistRow(row);
    }
    // Focus first column after add.
    const firstCol = draftColumns[0];
    if (firstCol) {
      // Allow next paint to register refs.
      queueMicrotask(() => focusCell(row.id, firstCol.id));
    }
  }, [canEdit, createEmptyRow, draftColumns, focusCell, persistRow]);

  // Zero-navigation contribution: create row + focus first cell.
  const didAutoInit = useRef(false);
  useEffect(() => {
    if (didAutoInit.current) return;
    if (!autoCreateRow || !autoFocusFirstCell) return;
    if (!canEdit) return;

    const firstCol = draftColumns[0];
    if (!firstCol) return;

    if (draftRows.length === 0) {
      didAutoInit.current = true;
      void addRow();
      return;
    }

    const firstRow = draftRows[0];
    if (firstRow) {
      didAutoInit.current = true;
      queueMicrotask(() => focusCell(firstRow.id, firstCol.id));
    }
  }, [addRow, autoCreateRow, autoFocusFirstCell, canEdit, draftColumns, draftRows, focusCell]);

  const updateCell = useCallback(
    (rowId: string, colId: string, raw: string) => {
      const column = draftColumns.find((c) => c.id === colId);
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
    [draftColumns]
  );

  const setRowStatus = useCallback((rowId: string, status: Row["status"]) => {
    setDraftRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, status } : r)));
  }, []);

  const saveRowById = useCallback(
    async (rowId: string) => {
      const row = draftRows.find((r) => r.id === rowId);
      if (!row) return;
      await persistRow(row);
    },
    [draftRows, persistRow]
  );

  // Clipboard paste (TSV) starting at active cell.
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLInputElement>, start: GridCoord) => {
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      e.preventDefault();

      const matrix = parseClipboardText(text);
      const res = applyClipboardMatrix({
        rows: draftRows,
        dataColumns: draftColumns,
        start,
        matrix,
        createEmptyRow,
      });

      setDraftRows(res.nextRows);

      if (!canEdit) return;

      // Persist per-row (one request per row) for correctness.
      const changed = res.nextRows.filter((r) => res.changedRowIds.includes(r.id));
      for (const row of changed) {
        await persistRow(row);
      }
    },
    [canEdit, createEmptyRow, draftColumns, draftRows, persistRow]
  );

  // Drop-anywhere file upload.
  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!canEdit) return;
      if (!ports?.onUploadFile) return;
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length === 0) return;

      for (const file of files) {
        const uploadId = await ports.onUploadFile(file);
        onUploaded?.(uploadId);
      }
    },
    [canEdit, onUploaded, ports]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Schema editing in header (owner only). Debounced save.
  const saveColumnsTimer = useRef<number | null>(null);
  const scheduleSaveColumns = useCallback(
    (next: Column[]) => {
      if (!canEditSchema) return;
      if (!ports?.onPutColumns) return;
      if (saveColumnsTimer.current) window.clearTimeout(saveColumnsTimer.current);
      saveColumnsTimer.current = window.setTimeout(async () => {
        try {
          const normalized = normalizeColumnsForSave({ workspaceId, columns: next });
          await ports.onPutColumns?.(normalized);
        } catch (error) {
          // Skip save if validation fails (e.g., missing descriptions) or API error occurs.
          // The user will need to fix the issue (e.g., add descriptions) before saving.
          console.warn("Skipping column save:", error instanceof Error ? error.message : error);
        }
      }, 500);
    },
    [canEditSchema, ports, workspaceId]
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

  // Guided flow: find columns missing descriptions and jump through them.
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
  }, [columnsMissingDescriptions]);

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
    [columnsMissingDescriptions, guidedColumnId, updateColumn]
  );

  // Expose guided flow start to parent via callback ref pattern.
  useEffect(() => {
    if (onStartGuidedFlow) {
      // Store the function in a way parent can call it.
      (window as any).__startGuidedFlow = startGuidedFlow;
    }
    return () => {
      delete (window as any).__startGuidedFlow;
    };
  }, [onStartGuidedFlow, startGuidedFlow]);

  const tableColumns = useMemo<ColumnDef<Row>[]>(() => {
    const defs: ColumnDef<Row>[] = [
      {
        id: "status",
        header: () => <span className="text-[11px] font-medium text-muted-foreground">Status</span>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <GridStatusCell
              row={r}
              canEdit={canEdit}
              onSetStatus={(status) => setRowStatus(r.id, status)}
            />
          );
        },
        size: 180,
        minSize: 100,
        maxSize: 300,
        enableResizing: true,
      },
      ...draftColumns.map((c) => ({
        id: c.id,
        header: () => {
          const isEditing = editingHeaderId === c.id && canEditSchema;
          return (
            <GridHeaderCell
              column={c}
              canEditSchema={canEditSchema}
              isEditing={isEditing}
              onStartEditing={() => setEditingHeaderId(c.id)}
              onStopEditing={() => setEditingHeaderId(null)}
              guidedColumnId={guidedColumnId}
              missingDescriptions={columnsMissingDescriptions}
              onGuidedDescriptionChange={handleGuidedDescriptionChange}
              onUpdateColumn={updateColumn}
            />
          );
        },
        size: 180,
        minSize: 50,
        maxSize: 800,
        enableResizing: true,
        cell: ({ row }) => {
          const r = row.original;
          const isActive = active?.rowId === r.id && active?.colId === c.id;
          return (
            <GridDataCell
              row={r}
              column={c}
              canEdit={canEdit}
              isActive={isActive}
              value={r.values[c.id]}
              inputRef={(el) => {
                inputRefs.current.set(makeCellKey(r.id, c.id), el);
              }}
              onFocus={() => setActive({ rowId: r.id, colId: c.id })}
              onChange={(raw) => updateCell(r.id, c.id, raw)}
              onBlur={() => {
                setActive(null);
                void saveRowById(r.id);
              }}
              onKeyDown={(e) => {
                if (!active) return;
                const rowIndex = draftRows.findIndex((rr) => rr.id === active.rowId);
                const colIndex = draftColumns.findIndex((cc) => cc.id === active.colId);

                const move = (nextRowIndex: number, nextColIndex: number) => {
                  const nextRow = draftRows[nextRowIndex];
                  const nextCol = draftColumns[nextColIndex];
                  if (nextRow && nextCol) {
                    e.preventDefault();
                    focusCell(nextRow.id, nextCol.id);
                  }
                };

                if (e.key === "Enter") {
                  move(rowIndex + (e.shiftKey ? -1 : 1), colIndex);
                } else if (e.key === "Tab") {
                  move(rowIndex, colIndex + (e.shiftKey ? -1 : 1));
                } else if (e.key === "ArrowDown") {
                  move(rowIndex + 1, colIndex);
                } else if (e.key === "ArrowUp") {
                  move(rowIndex - 1, colIndex);
                } else if (e.key === "ArrowRight") {
                  move(rowIndex, colIndex + 1);
                } else if (e.key === "ArrowLeft") {
                  move(rowIndex, colIndex - 1);
                }
              }}
              onPaste={(e) => {
                const rowIndex = draftRows.findIndex((rr) => rr.id === r.id);
                const colIndex = draftColumns.findIndex((cc) => cc.id === c.id);
                void handlePaste(e, { rowIndex, colIndex });
              }}
            />
          );
        },
      } satisfies ColumnDef<Row>)),
      ...(canEditSchema
        ? ([
            {
              id: "__addcol",
              header: () => (
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={addColumn}
                >
                  <Plus className="size-4" />
                  Add column
                </button>
              ),
              cell: () => null,
              size: 140,
              minSize: 100,
              maxSize: 200,
              enableResizing: false,
            } satisfies ColumnDef<Row>,
          ] as ColumnDef<Row>[])
        : []),
    ];

    return defs;
  }, [
    active,
    addColumn,
    canEdit,
    canEditSchema,
    columnsMissingDescriptions,
    draftColumns,
    draftRows,
    editingHeaderId,
    focusCell,
    guidedColumnId,
    handleGuidedDescriptionChange,
    handlePaste,
    saveRowById,
    setRowStatus,
    updateCell,
    updateColumn,
  ]);

  // TanStack Table uses internal function refs that trigger the React Compiler compatibility lint.
  // This is safe here because we treat the table instance as render-local state.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: draftRows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: {
      minSize: 50,
      size: 180,
      maxSize: 800,
    },
  });

  return (
    <div className="h-full w-full">
      <div
        className="relative h-full w-full overflow-auto bg-background"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {isDragOver ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="rounded-xl border-2 border-dashed border-primary/40 bg-card/80 px-8 py-10 text-center">
              <div className="text-sm font-medium">Drop files to parse into rows</div>
              <div className="mt-1 text-xs text-muted-foreground">We’ll add a new row automatically.</div>
            </div>
          </div>
        ) : null}

        <table className="w-full border-collapse" style={{ tableLayout: "fixed", width: table.getTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const colId = h.id !== "status" && h.id !== "__addcol" ? h.id : null;
                  return (
                    <th
                      key={h.id}
                      ref={colId ? setHeaderRef(colId) : undefined}
                      className={`border-b border-r bg-muted/30 p-2 text-left align-middle relative ${
                        h.column.getCanResize()
                          ? `group ${
                              h.column.getIsResizing()
                                ? "border-r-2 border-r-primary/70"
                                : "hover:border-r-2 hover:border-r-primary/50"
                            }`
                          : ""
                      }`}
                      style={{ width: h.getSize() }}
                    >
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanResize() && (
                        <div
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          className="absolute top-0 right-0 h-full w-[8px] cursor-col-resize touch-none select-none -mr-px"
                          style={{
                            userSelect: "none",
                            touchAction: "none",
                          }}
                          title="Drag to resize column"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id}>
                {r.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className={[
                      "border-b border-r align-middle",
                      cell.column.id === "status" ? "p-2" : "p-0",
                      // Make the cell itself feel "selected" like Excel (not the input).
                      cell.column.id !== "status"
                        ? "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-inset"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {draftRows.length === 0 && canEdit ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="p-10">
                  <div className="flex items-center justify-center">
                    <Button onClick={() => void addRow()}>Add first row</Button>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

