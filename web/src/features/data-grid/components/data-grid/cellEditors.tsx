"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Column, Row } from "@contracts";
import type { ClipboardEventHandler, KeyboardEventHandler } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY_ENUM_VALUE = "__dc_empty__";

export type CellEditorCommonProps = {
  column: Column;
  defaultValue: string;
  editorRef: (el: HTMLElement | null) => void;
  onSave: (raw: string) => void;
  onCancel: () => void;
};

export type TextLikeEditorProps = CellEditorCommonProps & {
  onPaste: ClipboardEventHandler<HTMLInputElement>;
  inputType?: React.ComponentProps<"input">["type"];
};

export function TextCellEditor(props: TextLikeEditorProps) {
  const { defaultValue, editorRef, onSave, onCancel, onPaste, inputType } =
    props;
  const ignoreBlurRef = useRef(false);

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur(); // save via onBlur
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        ignoreBlurRef.current = true;
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <Input
      ref={(el) => editorRef(el)}
      type={inputType}
      defaultValue={defaultValue}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onBlur={(e) => {
        if (ignoreBlurRef.current) {
          ignoreBlurRef.current = false;
          return;
        }
        onSave(e.target.value);
      }}
      onKeyDown={handleKeyDown}
      onPaste={(e) => {
        e.stopPropagation();
        onPaste(e);
      }}
      className="h-auto w-full rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
    />
  );
}

export function DateCellEditor(props: TextLikeEditorProps) {
  const { defaultValue, editorRef, onSave, onCancel, onPaste } = props;
  const ignoreBlurRef = useRef(false);

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const normalizedDefault = useMemo(() => {
    if (ISO_DATE_RE.test(defaultValue)) return defaultValue;
    // If it parses, normalize to YYYY-MM-DD so the browser date input can show it.
    const d = new Date(defaultValue);
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : "";
  }, [defaultValue]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur(); // save via onBlur
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        ignoreBlurRef.current = true;
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <Input
      ref={(el) => editorRef(el)}
      type="date"
      defaultValue={normalizedDefault}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onBlur={(e) => {
        if (ignoreBlurRef.current) {
          ignoreBlurRef.current = false;
          return;
        }
        onSave(e.target.value);
      }}
      onKeyDown={handleKeyDown}
      onPaste={(e) => {
        e.stopPropagation();
        onPaste(e);
      }}
      className="h-auto w-full rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
    />
  );
}

export function EnumCellEditor(props: CellEditorCommonProps) {
  const { column, defaultValue, editorRef, onSave, onCancel } = props;
  const [open, setOpen] = useState(true);
  const didSelectRef = useRef(false);

  const options = useMemo(() => column.enumValues ?? [], [column.enumValues]);
  const hasCustom = defaultValue.length > 0 && !options.includes(defaultValue);
  const selectedValue =
    defaultValue.length === 0
      ? EMPTY_ENUM_VALUE
      : options.includes(defaultValue) || hasCustom
        ? defaultValue
        : EMPTY_ENUM_VALUE;

  return (
    <Select
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // If the user dismisses the menu without selecting, treat it like cancel.
        if (!next && !didSelectRef.current) onCancel();
      }}
      value={selectedValue}
      onValueChange={(v) => {
        didSelectRef.current = true;
        onSave(v === EMPTY_ENUM_VALUE ? "" : v);
      }}
    >
      <SelectTrigger
        ref={(el) => editorRef(el)}
        className="h-auto w-full rounded-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        onKeyDown={(e) => {
          // Ensure Escape always defocuses the cell (not just closes the menu).
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onCancel();
        }}
        onPointerDownOutside={() => onCancel()}
      >
        <SelectItem value={EMPTY_ENUM_VALUE}>Empty</SelectItem>
        {hasCustom ? (
          <SelectItem value={defaultValue}>{defaultValue} (custom)</SelectItem>
        ) : null}
        {options.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getDefaultEditorValue(params: {
  column: Column;
  value: Row["values"][string];
  seeded?: string;
}): string {
  const { column, value, seeded } = params;
  if (seeded !== undefined) return seeded;
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  // defensive (schema only allows string/number/boolean/null)
  if (column.type === "json") return String(value);
  return "";
}

