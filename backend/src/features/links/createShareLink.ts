import { getAuthContext } from "@/lib/auth";
import { ddbGet, ddbPut } from "@/lib/dynamo";
import { newId } from "@/lib/ids";
import { pk, sk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { badRequest, created, forbidden, unauthorized } from "@/utils/response";
import { shareLinkSchema } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";
import { putLinkTokenIndex } from "./linkStore";

const payloadSchema = z.object({
  expiresAt: z.string().optional(),
  permissions: z
    .object({
      canUpload: z.boolean().optional(),
      canEditRows: z.boolean().optional(),
    })
    .optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) return badRequest("workspaceId is required");

  const { ownerToken } = getAuthContext(event);
  if (!ownerToken) return unauthorized();
  const ownerEmail = await getOwnerEmailForToken(ownerToken);
  if (!ownerEmail) return unauthorized("Invalid owner token");

  const ws = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
  if (!ws) return forbidden("Workspace not found or not accessible");
  if (ws.ownerEmail && ws.ownerEmail !== ownerEmail) return forbidden("Not workspace owner");

  const body = JSON.parse(event.body ?? "{}");
  const parsed = payloadSchema.parse(body);

  const linkId = newId("lnk");
  const token = newId("share");
  const link = shareLinkSchema.parse({
    id: linkId,
    workspaceId,
    token,
    expiresAt: parsed.expiresAt,
    passcodeRequired: false,
    status: "active",
    permissions: {
      canUpload: parsed.permissions?.canUpload ?? true,
      canEditRows: parsed.permissions?.canEditRows ?? true,
    },
  });

  await ddbPut({
    PK: pk.workspace(workspaceId),
    SK: sk.link(linkId),
    ...link,
  });
  await putLinkTokenIndex({ workspaceId, linkId, token });

  return created({ link });
};


