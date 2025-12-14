import { rowSchema } from "@/contracts";
import { getUserFromEvent, normalizeHeader } from "@/features/auth/auth";
import { ownerCanAccessWorkspace } from "@/features/auth/workspaceAuth";
import { getShareLinkByToken } from "@/features/links/linkStore";
import { LINK_TOKEN_HEADER } from "@/lib/constants";
import { ddbGet, ddbPut } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { badRequest, created, forbidden, success, unauthorized } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";

const payloadSchema = z.object({
  row: rowSchema.partial({ id: true, workspaceId: true, createdAt: true }),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
  }

  const rowId = event.pathParameters?.rowId;

  try {
    const user = getUserFromEvent(event);
    const linkToken = normalizeHeader(event, LINK_TOKEN_HEADER);

    const isOwner = user
      ? await ownerCanAccessWorkspace({ userId: user.userId, ownerEmail: user.email, workspaceId })
      : false;
    if (!isOwner) {
      if (!linkToken) return unauthorized("Authentication or share link token required");
      const link = await getShareLinkByToken(linkToken);
      if (!link) return unauthorized("Invalid share link token");
      if (link.workspaceId !== workspaceId) return forbidden("Share link is not valid for this workspace");
      if (!link.permissions.canEditRows) return forbidden("Share link does not allow editing rows");
    }

    const body = JSON.parse(event.body ?? "{}");
    const { row } = payloadSchema.parse(body);
    const id = (rowId ?? row.id)?.trim();
    if (!id) return badRequest("rowId is required");

    const existing = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.row(id) });
    const createdAt = existing?.createdAt ?? row.createdAt ?? new Date().toISOString();

    const result = rowSchema.parse({
      ...row,
      id,
      workspaceId,
      createdAt,
      updatedAt: new Date().toISOString(),
    });

    await ddbPut({
      PK: pk.workspace(workspaceId),
      SK: sk.row(id),
      ...result,
    });

    return rowId ? success({ row: result }) : created({ row: result });
  } catch (error: any) {
    return badRequest(error.message ?? "Invalid row payload");
  }
};
