import { columnSchema } from "@/contracts";
import { getUserFromEvent } from "@/features/auth/auth";
import { ownerCanAccessWorkspace } from "@/features/auth/workspaceAuth";
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
    const isOwner = await ownerCanAccessWorkspace({
      userId: user.userId,
      ownerEmail: user.email,
      workspaceId,
      workspace: ws,
    });
    if (!isOwner) return forbidden("Not workspace owner");

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

    // Validate the payload doesn't contain duplicate column IDs.
    // DynamoDB BatchWrite rejects duplicate keys (even across Put + Delete).
    const incomingIds = new Set<string>();
    for (const c of columns) {
      if (incomingIds.has(c.id)) {
        return badRequest(`Duplicate column id '${c.id}' in payload`);
      }
      incomingIds.add(c.id);
    }

    const existing = await ddbQueryAll<any>({
      PK: pk.workspace(workspaceId),
      beginsWithSK: "COLUMN#",
    });

    // Delete only columns that are not present in the incoming set.
    // For columns that are being updated, the Put will overwrite the existing item.
    const deletes = existing
      .map((i) => ({ PK: i.PK as string, SK: i.SK as string }))
      .filter((k) => {
        const id = String(k.SK ?? "").replace(/^COLUMN#/, "");
        return !incomingIds.has(id);
      });

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
