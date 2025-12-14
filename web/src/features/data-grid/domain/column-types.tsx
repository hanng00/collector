"use client";

import { cn } from "@/lib/utils";
import type { Column } from "@contracts";
import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Calendar,
  DollarSign,
  Hash,
  Link2,
  List,
  Mail,
  Paperclip,
  Type,
} from "lucide-react";

export type ColumnType = Column["type"];

export const COLUMN_TYPE_VALUES = [
  "text",
  "number",
  "date",
  "enum",
  "email",
  "url",
  "money",
  "json",
  "attachment",
] as const satisfies readonly ColumnType[];

export type ColumnTypeValue = (typeof COLUMN_TYPE_VALUES)[number];

export type ColumnTypeMeta = {
  label: string;
  icon: LucideIcon;
};

export const COLUMN_TYPE_META: Record<ColumnTypeValue, ColumnTypeMeta> = {
  text: { label: "Text", icon: Type },
  number: { label: "Number", icon: Hash },
  date: { label: "Date", icon: Calendar },
  enum: { label: "Enum", icon: List },
  email: { label: "Email", icon: Mail },
  url: { label: "URL", icon: Link2 },
  money: { label: "Money", icon: DollarSign },
  json: { label: "JSON", icon: Braces },
  attachment: { label: "Attachment", icon: Paperclip },
};

export function getColumnTypeMeta(type: ColumnTypeValue): ColumnTypeMeta {
  return COLUMN_TYPE_META[type];
}

export function ColumnTypeInline(props: {
  type: ColumnTypeValue;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
}) {
  const { type, className, iconClassName, labelClassName } = props;
  const meta = getColumnTypeMeta(type);
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icon className={cn("size-4 text-muted-foreground", iconClassName)} />
      <span className={cn("truncate", labelClassName)}>{meta.label}</span>
    </span>
  );
}

