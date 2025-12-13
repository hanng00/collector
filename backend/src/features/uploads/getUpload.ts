import { getAuthContext } from "@/lib/auth";
import { ddbGet } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { ownerCanAccessWorkspace } from "@/lib/workspaceAuth";
import { getShareLinkByToken } from "@/features/links/linkStore";
import { badRequest, forbidden, notFound, success, unauthorized } from "@/utils/response";
import { uploadSchema } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  const uploadId = event.pathParameters?.uploadId;
  if (!workspaceId || !uploadId) {
    return badRequest("workspaceId and uploadId are required");
  }

  const { ownerToken, linkToken } = getAuthContext(event);
  if (!ownerToken && !linkToken) return unauthorized();

  if (ownerToken) {
    const ownerEmail = await getOwnerEmailForToken(ownerToken);
    if (!ownerEmail) return unauthorized("Invalid owner token");
    const ok = await ownerCanAccessWorkspace({ ownerEmail, workspaceId });
    if (!ok) return forbidden("Workspace not found or not accessible");
  } else if (linkToken) {
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
