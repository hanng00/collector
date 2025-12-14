import { uploadSchema } from "@/contracts";
import { getUserFromEvent, normalizeHeader } from "@/features/auth/auth";
import { ownerCanAccessWorkspace } from "@/features/auth/workspaceAuth";
import { getShareLinkByToken } from "@/features/links/linkStore";
import { LINK_TOKEN_HEADER } from "@/lib/constants";
import { ddbGet } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { badRequest, forbidden, notFound, success, unauthorized } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  const uploadId = event.pathParameters?.uploadId;
  if (!workspaceId || !uploadId) {
    return badRequest("workspaceId and uploadId are required");
  }

  const user = getUserFromEvent(event);
  if (!user) return unauthorized();
  
  const linkToken = normalizeHeader(event, LINK_TOKEN_HEADER);

  const isOwner = await ownerCanAccessWorkspace({ userId: user.userId, workspaceId });
  if (!isOwner) {
    if (!linkToken) return forbidden("Workspace not found or not accessible");
    const link = await getShareLinkByToken(linkToken);
    if (!link) return unauthorized("Invalid share link token");
    if (link.workspaceId !== workspaceId) return forbidden("Share link is not valid for this workspace");
  }

  const item = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.upload(uploadId) });
  if (!item) return notFound("Upload not found");
  const { PK: _pk, SK: _sk, ...rest } = item;
  const upload = uploadSchema.parse(rest);

  return success({ upload });
};
