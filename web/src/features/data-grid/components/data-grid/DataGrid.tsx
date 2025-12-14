"use client";

import { Button } from "@/components/ui/button";
import { coerceCellValue } from "@/features/data-grid/domain/grid";
import type { Row } from "@contracts";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { GridDataCell } from "./GridDataCell";
import { GridHeaderCell } from "./GridHeaderCell";
import { GridStatusCell } from "./GridStatusCell";
import {
  useGridAutoInit,
  useGridCellFocus,
  useGridClipboard,
  useGridColumns,
  useGridDragDrop,
  useGridGuidedFlow,
  useGridRows,
} from "./hooks";
import type { DataGridProps } from "./types";

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
  const dataColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );
  const sortedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
      ),
    [rows]
  );

  // Row management
  const {
    draftRows,
    createEmptyRow,
    setRowStatus,
    addRow,
    updateRows,
    persistRow,
  } = useGridRows({
    initialRows: sortedRows,
    columns: dataColumns,
    workspaceId,
    contributorLinkId,
    canEdit,
    onUpsertRow: ports?.onUpsertRow,
  });

  // Column management
  const { draftColumns, updateColumn, addColumn } = useGridColumns({
    initialColumns: dataColumns,
    workspaceId,
    canEditSchema,
    onPutColumns: ports?.onPutColumns,
  });

  // Cell focus management
  const {
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
  } = useGridCellFocus();

  // Clipboard handling
  const { handlePaste } = useGridClipboard({
    draftRows,
    draftColumns,
    canEdit,
    createEmptyRow,
    persistRow,
  });

  const [editSeed, setEditSeed] = useState<{
    rowId: string;
    colId: string;
    value: string;
  } | null>(null);

  const cancelAndDefocus = useCallback(() => {
    setEditSeed(null);
    clearSelection();
  }, [clearSelection]);

  const saveCell = useCallback(
    async (rowId: string, colId: string, raw: string) => {
      let nextRow: Row | null = null;
      updateRows((prev) => {
        const row = prev.find((r) => r.id === rowId);
        const column = draftColumns.find((c) => c.id === colId);
        if (!row || !column) return prev;

        const nextValue = coerceCellValue(column, raw);
        nextRow = {
          ...row,
          values: { ...row.values, [colId]: nextValue },
          updatedAt: new Date().toISOString(),
        };
        return prev.map((r) => (r.id === rowId ? nextRow! : r));
      });
      // Exit edit mode immediately so keyboard navigation (arrows) works
      // even if persistence is slow.
      endEdit();
      if (nextRow) void persistRow(nextRow);
    },
    [draftColumns, endEdit, persistRow, updateRows]
  );

  // Drag and drop
  const { isDragOver, onDrop, onDragOver, onDragLeave } = useGridDragDrop({
    canEdit,
    onUploadFile: ports?.onUploadFile,
    onUploaded,
  });

  // Guided flow
  const {
    guidedColumnId,
    columnsMissingDescriptions,
    handleGuidedDescriptionChange,
  } = useGridGuidedFlow({
    draftColumns,
    headerRefs,
    updateColumn,
    onStartGuidedFlow,
  });

  // Auto-init
  useGridAutoInit({
    autoCreateRow,
    autoFocusFirstCell,
    canEdit,
    draftRows,
    draftColumns,
    addRow,
    focusCell: selectCell,
  });

  // Header editing state
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);

  // Handle paste with row updates
  const handlePasteWithUpdate = useCallback(
    async (
      e: React.ClipboardEvent<HTMLInputElement>,
      start: { rowIndex: number; colIndex: number }
    ) => {
      const nextRows = await handlePaste(e, start);
      if (nextRows) {
        updateRows(() => nextRows);
      }
    },
    [handlePaste, updateRows]
  );

  // Add row with focus
  const handleAddRow = useCallback(async () => {
    const row = await addRow();
    const firstCol = draftColumns[0];
    if (firstCol) {
      queueMicrotask(() => {
        if (canEdit) beginEdit(row.id, firstCol.id);
        else selectCell(row.id, firstCol.id);
      });
    }
  }, [addRow, beginEdit, canEdit, draftColumns, selectCell]);

  const tableColumns = useMemo<ColumnDef<Row>[]>(() => {
    const defs: ColumnDef<Row>[] = [
      {
        id: "status",
        header: () => (
          <span className="text-[11px] font-medium text-muted-foreground">
            Status
          </span>
        ),
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
        size: 250,
        minSize: 100,
        maxSize: 400,
        enableResizing: true,
      },
      ...draftColumns.map(
        (c) =>
          ({
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
            size: 250,
            minSize: 50,
            maxSize: 800,
            enableResizing: true,
            cell: ({ row }) => {
              const r = row.original;
              const isSelected =
                selected?.rowId === r.id && selected?.colId === c.id;
              const isEditing =
                editing?.rowId === r.id && editing?.colId === c.id;
              const seeded =
                isEditing &&
                editSeed?.rowId === r.id &&
                editSeed?.colId === c.id
                  ? editSeed.value
                  : undefined;
              return (
                <GridDataCell
                  column={c}
                  canEdit={canEdit}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  value={r.values[c.id]}
                  editDefaultValue={seeded}
                  cellRef={(el) => setCellRef(r.id, c.id, el)}
                  inputRef={(el) => setInputRef(r.id, c.id, el)}
                  onSelect={() => selectCell(r.id, c.id)}
                  onBeginEdit={() => beginEdit(r.id, c.id)}
                  onCancelEdit={cancelAndDefocus}
                  onSave={(raw) => {
                    void saveCell(r.id, c.id, raw);
                  }}
                  onKeyDownSelected={(e) => {
                    // Only handle navigation when this is the selected cell.
                    if (!isSelected) return;

                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelAndDefocus();
                      return;
                    }

                    const rowIndex = row.index;
                    const colIndex = draftColumns.findIndex(
                      (cc) => cc.id === c.id
                    );
                    if (rowIndex < 0 || colIndex < 0) return;

                    const moveTo = (
                      nextRowIndex: number,
                      nextColIndex: number
                    ) => {
                      const nextRow = draftRows[nextRowIndex];
                      const nextCol = draftColumns[nextColIndex];
                      if (!nextRow || !nextCol) return;
                      e.preventDefault();
                      selectCell(nextRow.id, nextCol.id);
                    };

                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canEdit) beginEdit(r.id, c.id);
                      return;
                    }

                    // Start editing by typing (Excel-like).
                    if (
                      canEdit &&
                      e.key.length === 1 &&
                      !e.metaKey &&
                      !e.ctrlKey &&
                      !e.altKey
                    ) {
                      e.preventDefault();
                      setEditSeed({ rowId: r.id, colId: c.id, value: e.key });
                      beginEdit(r.id, c.id, { select: false });
                      return;
                    }

                    if (
                      canEdit &&
                      (e.key === "Backspace" || e.key === "Delete")
                    ) {
                      e.preventDefault();
                      setEditSeed({ rowId: r.id, colId: c.id, value: "" });
                      beginEdit(r.id, c.id, { select: false });
                      return;
                    }

                    if (e.key === "ArrowDown") moveTo(rowIndex + 1, colIndex);
                    else if (e.key === "ArrowUp")
                      moveTo(rowIndex - 1, colIndex);
                    else if (e.key === "ArrowRight")
                      moveTo(rowIndex, colIndex + 1);
                    else if (e.key === "ArrowLeft")
                      moveTo(rowIndex, colIndex - 1);
                  }}
                  onPaste={(e) => {
                    const rowIndex = row.index;
                    const colIndex = draftColumns.findIndex(
                      (cc) => cc.id === c.id
                    );
                    if (rowIndex < 0 || colIndex < 0) return;
                    void handlePasteWithUpdate(e, { rowIndex, colIndex });
                  }}
                />
              );
            },
          } satisfies ColumnDef<Row>)
      ),
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
              enableResizing: false,
            } satisfies ColumnDef<Row>,
          ] as ColumnDef<Row>[])
        : []),
    ];

    return defs;
  }, [
    addColumn,
    beginEdit,
    canEdit,
    canEditSchema,
    cancelAndDefocus,
    columnsMissingDescriptions,
    draftColumns,
    editing,
    editingHeaderId,
    editSeed,
    draftRows,
    guidedColumnId,
    handleGuidedDescriptionChange,
    handlePasteWithUpdate,
    saveCell,
    selectCell,
    selected,
    setCellRef,
    setInputRef,
    setRowStatus,
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
      size: 200,
      maxSize: 800,
    },
  });

  return (
    <div className="h-full w-full min-w-0 overflow-hidden">
      <div
        className="relative h-full w-full min-w-0 overflow-auto bg-background"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {isDragOver ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="rounded-xl border-2 border-dashed border-primary/40 bg-card/80 px-8 py-10 text-center">
              <div className="text-sm font-medium">
                Drop files to parse into rows
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                We&apos;ll add a new row automatically.
              </div>
            </div>
          </div>
        ) : null}

        <table
          className="w-full border-collapse"
          style={{ tableLayout: "fixed", width: table.getTotalSize() }}
        >
          <thead className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const colId =
                    h.id !== "status" && h.id !== "__addcol" ? h.id : null;
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
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
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
                      selected?.rowId === cell.row.original.id &&
                      selected?.colId === cell.column.id
                        ? "ring-2 ring-primary/40 ring-inset"
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
            {canEdit ? (
              <tr>
                <td colSpan={table.getAllColumns().length} className="p-10">
                  <div className="flex items-center justify-center">
                    <Button onClick={handleAddRow} variant="secondary">
                      <Plus />
                      {draftRows.length === 0 ? "Add first row" : "Add row"}
                    </Button>
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
