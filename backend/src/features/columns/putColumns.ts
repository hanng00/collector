import { getAuthContext } from "@/lib/auth";
import { ddbBatchWrite, ddbGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { badRequest, forbidden, success, unauthorized } from "@/utils/response";
import { columnSchema } from "@/contracts";
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

  try {
    const { ownerToken } = getAuthContext(event);
    if (!ownerToken) return unauthorized();
    const ownerEmail = await getOwnerEmailForToken(ownerToken);
    if (!ownerEmail) return unauthorized("Invalid owner token");

    const ws = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
    if (!ws) return forbidden("Workspace not found or not accessible");
    if (ws.ownerEmail && ws.ownerEmail !== ownerEmail) return forbidden("Not workspace owner");

    const body = JSON.parse(event.body ?? "{}");
    const parsed = payloadSchema.parse(body);

    const columns = parsed.columns.map((c) => ({
      ...c,
      workspaceId,
    }));

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
