"use client";

import { toDisplayValueForColumn } from "@/features/data-grid/domain/grid";
import type { Column, Row } from "@contracts";
import type { ClipboardEventHandler, KeyboardEventHandler } from "react";
import { useCallback } from "react";
import {
  DateCellEditor,
  EnumCellEditor,
  getDefaultEditorValue,
  TextCellEditor,
} from "./cellEditors";

export function GridDataCell(props: {
  column: Column;
  canEdit: boolean;
  isSelected: boolean;
  isEditing: boolean;

  value: Row["values"][string];
  editDefaultValue?: string;

  onSelect: () => void;
  onBeginEdit: () => void;
  onCancelEdit: () => void;
  onSave: (raw: string) => void;
  onKeyDownSelected: KeyboardEventHandler<HTMLDivElement>;
  onPaste: ClipboardEventHandler<HTMLInputElement>;

  cellRef: (el: HTMLDivElement | null) => void;
  inputRef: (el: HTMLElement | null) => void;
}) {
  const {
    column,
    canEdit,
    isSelected,
    isEditing,
    value,
    editDefaultValue,
    onSelect,
    onBeginEdit,
    onCancelEdit,
    onSave,
    onKeyDownSelected,
    onPaste,
    cellRef,
    inputRef,
  } = props;
  const displayValue = toDisplayValueForColumn(column, value);
  const editorDefaultValue = getDefaultEditorValue({
    column,
    value,
    seeded: editDefaultValue,
  });

  const handleCancel = useCallback(() => {
    onCancelEdit();
  }, [onCancelEdit]);

  return (
    <div
      ref={cellRef}
      tabIndex={0}
      className={[
        "min-w-[180px] h-8 px-2 py-1 flex items-center cursor-cell outline-none",
        isSelected ? "bg-primary/5" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect}
      onDoubleClick={() => {
        if (canEdit) onBeginEdit();
      }}
      onKeyDown={onKeyDownSelected}
    >
      {canEdit && isEditing ? (
        column.type === "enum" ? (
          <EnumCellEditor
            column={column}
            defaultValue={editorDefaultValue}
            editorRef={inputRef}
            onSave={onSave}
            onCancel={handleCancel}
          />
        ) : column.type === "date" ? (
          <DateCellEditor
            column={column}
            defaultValue={editorDefaultValue}
            editorRef={inputRef}
            onSave={onSave}
            onCancel={handleCancel}
            onPaste={onPaste}
          />
        ) : (
          <TextCellEditor
            column={column}
            defaultValue={editorDefaultValue}
            editorRef={inputRef}
            onSave={onSave}
            onCancel={handleCancel}
            onPaste={onPaste}
            inputType={
              column.type === "number"
                ? "number"
                : column.type === "email"
                  ? "email"
                  : column.type === "url"
                    ? "url"
                    : undefined
            }
          />
        )
      ) : (
        <span className="text-sm text-foreground truncate">
          {displayValue || (
            <span className="text-muted-foreground">
              {column.type === "date" ? "YYYY-MM-DD" : ""}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

