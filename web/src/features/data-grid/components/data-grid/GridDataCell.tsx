"use client";

import { Input } from "@/components/ui/input";
import { toDisplayValue } from "@/features/data-grid/domain/grid";
import type { Column, Row } from "@contracts";
import type { ClipboardEventHandler, KeyboardEventHandler } from "react";
import { useEffect, useRef } from "react";

export function GridDataCell(props: {
  row: Row;
  column: Column;
  canEdit: boolean;
  isActive: boolean;

  value: Row["values"][string];

  onFocus: () => void;
  onChange: (raw: string) => void;
  onBlur: () => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onPaste: ClipboardEventHandler<HTMLInputElement>;

  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const { row, column, canEdit, isActive, value, onFocus, onChange, onBlur, onKeyDown, onPaste, inputRef } =
    props;
  const displayValue = toDisplayValue(value);
  const internalInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input when cell becomes active
  useEffect(() => {
    if (isActive && canEdit && internalInputRef.current) {
      queueMicrotask(() => {
        internalInputRef.current?.focus();
        internalInputRef.current?.select();
      });
    }
  }, [isActive, canEdit]);

  // Sync refs
  useEffect(() => {
    inputRef(internalInputRef.current);
  }, [inputRef]);

  // Read-only: render like a plain cell (no input chrome).
  if (!canEdit) {
    return (
      <div className="min-w-[180px] h-8 px-2 py-1 flex items-center">
        <span className="text-sm text-foreground truncate">
          {displayValue || (
            <span className="text-muted-foreground">{column.type === "date" ? "YYYY-MM-DD" : ""}</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      className="min-w-[180px] h-8 px-2 py-1 flex items-center cursor-cell"
      onClick={onFocus}
      onDoubleClick={onFocus}
    >
      {isActive ? (
        <Input
          ref={(el) => {
            internalInputRef.current = el;
            inputRef(el);
          }}
          value={displayValue}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={column.type === "date" ? "YYYY-MM-DD" : ""}
          className="h-auto w-full rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
        />
      ) : (
        <span className="text-sm text-foreground truncate">
          {displayValue || (
            <span className="text-muted-foreground">{column.type === "date" ? "YYYY-MM-DD" : ""}</span>
          )}
        </span>
      )}
    </div>
  );
}

