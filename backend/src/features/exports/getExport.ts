import { columnSchema, rowSchema } from "@/contracts";
import { getUserFromEvent } from "@/features/auth/auth";
import { ownerCanAccessWorkspace } from "@/features/auth/workspaceAuth";
import { ddbGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { badRequest, forbidden, unauthorized } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
  }

  const user = getUserFromEvent(event);
  if (!user) return unauthorized("Authentication required");

  const ws = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
  if (!ws) return forbidden("Workspace not found or not accessible");
  const isOwner = await ownerCanAccessWorkspace({
    userId: user.userId,
    ownerEmail: user.email,
    workspaceId,
    workspace: ws,
  });
  if (!isOwner) return forbidden("Not workspace owner");

  const colItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "COLUMN#" });
  const columns = colItems
    .map((i) => {
      const { PK: _pk, SK: _sk, ...rest } = i ?? {};
      return columnSchema.parse(rest);
    })
    .sort((a, b) => a.order - b.order);

  const rowItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "ROW#" });
  const rows = rowItems.map((i) => {
    const { PK: _pk, SK: _sk, ...rest } = i ?? {};
    return rowSchema.parse(rest);
  });

  const header = columns.map((c) => csvEscape(c.name)).join(",");
  const lines = [header];
  for (const r of rows) {
    const line = columns
      .map((c) => csvEscape(r.values[c.id] ?? null))
      .join(",");
    lines.push(line);
  }
  const csv = lines.join("\n");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${workspaceId}.csv"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
    body: csv,
  };
};

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}
