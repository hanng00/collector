import { columnSchema, rowSchema, uploadSchema, type Column } from "@/contracts";
import { ddbGet, ddbPut, ddbQueryAll, ddbUpdate } from "@/lib/dynamo";
import { newId } from "@/lib/ids";
import { pk, sk } from "@/lib/keys";
import { getObjectBytes } from "@/lib/s3";

function normalizeName(name: string) {
  return name.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

function parseCsvFirstRow(text: string): { headers: string[]; values: string[] } | null {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;
  const headers = lines[0]?.split(",").map((s) => s.trim().replaceAll(/^"|"$/g, "")) ?? [];
  const values = lines[1]?.split(",").map((s) => s.trim().replaceAll(/^"|"$/g, "")) ?? [];
  return { headers, values };
}

function coerceValue(column: Column, raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.trim() === "") return null;

  switch (column.type) {
    case "number": {
      const n = typeof raw === "number" ? raw : Number(String(raw).replaceAll(",", ""));
      return Number.isFinite(n) ? n : null;
    }
    case "date": {
      const d = new Date(String(raw));
      return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
    }
    case "email":
    case "url":
    case "text":
    case "money": {
      const s = String(raw).trim();
      if (column.type === "money") {
        const cleaned = s.replaceAll(/[^0-9.\-]/g, "");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : s;
      }
      return s;
    }
    case "enum": {
      const s = String(raw).trim();
      if (!column.enumValues || column.enumValues.length === 0) return s;
      const found = column.enumValues.find((v) => normalizeName(v) === normalizeName(s));
      return found ?? s;
    }
    case "json": {
      // Row cell values are primitives; store JSON as a string.
      if (typeof raw === "object") {
        try {
          return JSON.stringify(raw);
        } catch {
          return String(raw);
        }
      }
      const s = String(raw);
      // If it's already JSON-ish, keep as-is; otherwise store raw string.
      return s.trim().startsWith("{") || s.trim().startsWith("[") ? s : s;
    }
    case "attachment":
      return null;
    default:
      return String(raw);
  }
}

function extractFromText(columns: Column[], text: string): { values: Record<string, unknown>; confidence: number } {
  const values: Record<string, unknown> = {};
  let hits = 0;

  for (const col of columns) {
    const regex = new RegExp(`^\\s*${escapeRegExp(col.name)}\\s*[:=]\\s*(.+)\\s*$`, "im");
    const m = text.match(regex);
    if (m && m[1]) {
      values[col.id] = coerceValue(col, m[1].trim());
      hits++;
    }
  }

  const confidence = columns.length === 0 ? 0 : Math.min(0.85, hits / columns.length);
  return { values, confidence };
}

function escapeRegExp(s: string) {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function processUploadObject({
  bucket,
  key,
  workspaceId,
  uploadId,
}: {
  bucket: string;
  key: string;
  workspaceId: string;
  uploadId: string;
}) {
  const tableUpload = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.upload(uploadId) });
  if (!tableUpload) {
    console.warn("Upload record not found; skipping", { workspaceId, uploadId });
    return;
  }

  const now = new Date().toISOString();
  await ddbUpdate({
    key: { PK: pk.workspace(workspaceId), SK: sk.upload(uploadId) },
    updateExpression: "SET #s = :s, updatedAt = :t",
    expressionAttributeNames: { "#s": "status" },
    expressionAttributeValues: { ":s": "processing", ":t": now },
  });

  const { bytes, contentType } = await getObjectBytes({
    bucket,
    key,
  });

  // Hard stop on large payloads (basic safety)
  if (bytes.byteLength > 5 * 1024 * 1024) {
    await ddbUpdate({
      key: { PK: pk.workspace(workspaceId), SK: sk.upload(uploadId) },
      updateExpression: "SET #s = :s, errors = :e, updatedAt = :t",
      expressionAttributeNames: { "#s": "status" },
      expressionAttributeValues: {
        ":s": "failed",
        ":e": ["File too large for inline extraction"],
        ":t": new Date().toISOString(),
      },
    });
    return;
  }

  const text = Buffer.from(bytes).toString("utf8");

  const columnItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "COLUMN#" });
  const columns = columnItems
    .map((i) => {
      const { PK: _pk, SK: _sk, ...rest } = i ?? {};
      return columnSchema.parse(rest);
    })
    .sort((a, b) => a.order - b.order);

  let extracted: { values: Record<string, unknown>; confidence: number; parsedFields?: Record<string, unknown> };

  if (contentType?.includes("application/json") || text.trim().startsWith("{")) {
    try {
      const obj = JSON.parse(text);
      const values: Record<string, unknown> = {};
      let matched = 0;
      for (const col of columns) {
        const byId = (obj as any)?.[col.id];
        const byName = (obj as any)?.[col.name];
        const raw = byId ?? byName;
        if (raw !== undefined) {
          values[col.id] = coerceValue(col, raw);
          matched++;
        }
      }
      extracted = {
        values,
        confidence: columns.length === 0 ? 0 : Math.min(0.95, matched / columns.length),
        parsedFields: Object.fromEntries(
          Object.entries(values).map(([colId, v]) => [columns.find((c) => c.id === colId)?.name ?? colId, v])
        ),
      };
    } catch {
      extracted = extractFromText(columns, text);
    }
  } else if (contentType?.includes("text/csv") || text.includes(",") && text.includes("\n")) {
    const parsed = parseCsvFirstRow(text);
    if (!parsed) {
      extracted = extractFromText(columns, text);
    } else {
      const values: Record<string, unknown> = {};
      let matched = 0;
      for (let i = 0; i < parsed.headers.length; i++) {
        const h = parsed.headers[i];
        const v = parsed.values[i];
        if (h === undefined) continue;
        const col =
          columns.find((c) => normalizeName(c.name) === normalizeName(h)) ??
          columns.find((c) => normalizeName(c.id) === normalizeName(h));
        if (!col) continue;
        values[col.id] = coerceValue(col, v);
        matched++;
      }
      extracted = {
        values,
        confidence: columns.length === 0 ? 0 : Math.min(0.9, matched / columns.length),
        parsedFields: Object.fromEntries(
          Object.entries(values).map(([colId, v]) => [columns.find((c) => c.id === colId)?.name ?? colId, v])
        ),
      };
    }
  } else {
    extracted = extractFromText(columns, text);
  }

  const baseUpload = uploadSchema.parse({
    ...tableUpload,
    workspaceId,
    id: uploadId,
  });

  const rowId = baseUpload.rowId ?? newId("row");
  const row = rowSchema.parse({
    id: rowId,
    workspaceId,
    linkId: baseUpload.linkId,
    createdByLinkId: baseUpload.linkId,
    values: Object.fromEntries(
      columns.map((c) => [c.id, (extracted.values[c.id] ?? null) as any])
    ),
    status: extracted.confidence >= 0.8 ? "parsed" : "submitted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await ddbPut({
    PK: pk.workspace(workspaceId),
    SK: sk.row(rowId),
    ...row,
  });

  const status = extracted.confidence >= 0.8 ? "succeeded" : extracted.confidence > 0 ? "partial" : "failed";
  const parsedFields = extracted.parsedFields ?? undefined;

  await ddbUpdate({
    key: { PK: pk.workspace(workspaceId), SK: sk.upload(uploadId) },
    updateExpression:
      "SET #s = :s, updatedAt = :t, rowId = :rid, parsedFields = :pf, confidence = :c",
    expressionAttributeNames: { "#s": "status" },
    expressionAttributeValues: {
      ":s": status,
      ":t": new Date().toISOString(),
      ":rid": rowId,
      ":pf": parsedFields ?? {},
      ":c": extracted.confidence,
    },
  });
}


