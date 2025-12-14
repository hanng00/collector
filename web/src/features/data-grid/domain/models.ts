export type RowId = string;
export type ColumnId = string;

export type CellRef = {
  rowId: RowId;
  columnId: ColumnId;
};

export type Scalar = string | number | boolean | null;

export type AttachmentRef =
  | {
      kind: "upload";
      uploadId: string;
      fileName?: string;
      status?: "pending" | "processing" | "succeeded" | "partial" | "failed";
    };

export type CellContent =
  | { kind: "empty" }
  | { kind: "literal"; value: Scalar }
  // v1: formulas degrade to a persisted string (e.g. "=SUM(A1:A3)")
  // Later: a real formula engine + dependency graph.
  | { kind: "formula"; formula: string; result?: Scalar | { error: string } }
  | { kind: "json"; value: unknown; text?: string }
  | { kind: "attachment"; attachments: AttachmentRef[] };

export type CellComment = {
  id: string;
  body: string;
  createdAt: string;
  author?: { kind: "owner" | "contributor"; id?: string };
  resolvedAt?: string;
};

export type CellProvenance =
  | { kind: "manual" }
  | { kind: "upload_parse"; uploadId: string; confidence?: number; raw?: unknown };

export type CellIssue = { code: "required" | "type" | "invalid"; message: string };

export type Cell = {
  content: CellContent;
  meta: {
    updatedAt?: string;
    provenance?: CellProvenance;
    comments?: CellComment[];
    issues?: CellIssue[];
  };
};

export type GridColumnType =
  | "text"
  | "number"
  | "date"
  | "enum"
  | "email"
  | "url"
  | "money"
  | "json"
  | "attachment";

export type GridColumn = {
  id: ColumnId;
  name: string;
  description: string;
  type: GridColumnType;
  required: boolean;
  order: number;

  enumValues?: string[];
  examples?: string[];
  hint?: string;
};

export type GridRowStatus = "draft" | "submitted" | "parsed";

export type GridRow = {
  id: RowId;
  status: GridRowStatus;
  createdAt: string;
  updatedAt?: string;
  cells: Record<ColumnId, Cell>;
};

export type GridDocument = {
  workspaceId: string;
  columns: GridColumn[];
  rows: GridRow[];
};

