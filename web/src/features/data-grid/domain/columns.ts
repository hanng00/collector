import { columnSchema, type Column } from "@contracts";

export function newColumnDraft(params: {
  workspaceId: string;
  order: number;
}): Column {
  return columnSchema.parse({
    id: `col-${crypto.randomUUID()}`,
    workspaceId: params.workspaceId,
    name: "New column",
    // Descriptions are required for reliable extraction. Keep this non-empty so autosave succeeds.
    description: "Describe what should go into this column.",
    type: "text",
    required: false,
    order: params.order,
  });
}

export function normalizeColumnsForSave(params: {
  workspaceId: string;
  columns: Column[];
}): Column[] {
  // Ensure stable ordering and correct workspaceId.
  const sorted = [...params.columns].sort((a, b) => a.order - b.order);
  const normalized = sorted.map((c, idx) =>
    columnSchema.parse({
      ...c,
      workspaceId: params.workspaceId,
      order: idx + 1,
    })
  );

  // Validate that all columns have non-empty descriptions (required by backend).
  for (const col of normalized) {
    if (!col.description || col.description.trim().length === 0) {
      throw new Error(`Column '${col.name}' is missing a description`);
    }
  }

  return normalized;
}

