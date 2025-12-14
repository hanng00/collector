import type { Cell, CellContent, GridColumn, GridDocument, GridRow } from "@/features/data-grid/domain/models";
import type { Column, Row } from "@contracts";

export function toGridDocument(input: {
  workspaceId: string;
  columns: Column[];
  rows: Row[];
}): GridDocument {
  const columns = [...input.columns].sort((a, b) => a.order - b.order).map(toGridColumn);
  const rows = [...input.rows]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((r) => toGridRow(r, columns));

  return { workspaceId: input.workspaceId, columns, rows };
}

export function toGridColumn(c: Column): GridColumn {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    type: c.type,
    required: !!c.required,
    order: c.order,
    enumValues: c.enumValues,
    examples: c.examples,
    hint: c.hint,
  };
}

export function toGridRow(row: Row, columns: GridColumn[]): GridRow {
  const cells: GridRow["cells"] = {};
  for (const col of columns) {
    const raw = row.values[col.id];
    cells[col.id] = cellFromContractsValue(raw, col);
  }

  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    cells,
  };
}

export function toContractsRowValues(params: {
  row: GridRow;
  columns: GridColumn[];
}): Row["values"] {
  const next: Row["values"] = {};
  for (const col of params.columns) {
    const cell = params.row.cells[col.id];
    next[col.id] = contractsScalarFromCellContent(cell?.content, col);
  }
  return next;
}

function cellFromContractsValue(value: Row["values"][string] | undefined, column: GridColumn): Cell {
  const content: CellContent = (() => {
    if (column.type === "attachment") return { kind: "empty" };
    if (value === null || value === undefined) return { kind: "empty" };

    if (typeof value === "string") {
      if (value.startsWith("=")) return { kind: "formula", formula: value };
      if (column.type === "json") {
        try {
          return { kind: "json", value: JSON.parse(value), text: value };
        } catch {
          return { kind: "literal", value };
        }
      }
      return { kind: "literal", value };
    }

    return { kind: "literal", value };
  })();

  return { content, meta: {} };
}

function contractsScalarFromCellContent(
  content: CellContent | undefined,
  column: GridColumn
): Row["values"][string] {
  if (!content) return null;
  switch (content.kind) {
    case "empty":
      return null;
    case "literal":
      return content.value;
    case "formula":
      return content.formula;
    case "json": {
      if (typeof content.text === "string") return content.text;
      try {
        return JSON.stringify(content.value);
      } catch {
        return null;
      }
    }
    case "attachment":
      // Not persisted in the current contracts model (yet).
      return column.type === "attachment" ? null : null;
  }
}

