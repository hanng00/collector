import { columnSchema } from "@/contracts";
import { getUserFromEvent } from "@/features/auth/auth";
import { ddbBatchWrite, ddbGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { badRequest, forbidden, success, unauthorized } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";

const payloadSchema = z.object({
  columns: z.array(columnSchema),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
  }

  const user = getUserFromEvent(event);
  if (!user) return unauthorized("Authentication required");

  try {
    const ws = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
    if (!ws) return forbidden("Workspace not found or not accessible");
    if (ws.ownerId && ws.ownerId !== user.userId) return forbidden("Not workspace owner");

    const body = JSON.parse(event.body ?? "{}");
    const parsed = payloadSchema.parse(body);

    const columns = parsed.columns.map((c) => ({
      ...c,
      workspaceId,
    }));

    // Require a description for every column. This is critical for reliable AI extraction.
    for (const c of columns) {
      if (!c.description || c.description.trim().length === 0) {
        return badRequest(`Column '${c.name}' is missing a description`);
      }
    }

    const existing = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "COLUMN#" });
    const deletes = existing.map((i) => ({ PK: i.PK as string, SK: i.SK as string }));
    const puts = columns.map((c) => ({
      PK: pk.workspace(workspaceId),
      SK: sk.column(c.id),
      ...c,
    }));

    await ddbBatchWrite({ deletes, puts });

    return success({
      workspaceId,
      columns,
    });
  } catch (error: any) {
    return badRequest(error.message ?? "Invalid columns payload");
  }
};
