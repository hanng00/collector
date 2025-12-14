import type { Column } from "@/contracts";
import { getUserFromEvent, normalizeHeader } from "@/features/auth/auth";
import { ownerCanAccessWorkspace } from "@/features/auth/workspaceAuth";
import { getShareLinkByToken } from "@/features/links/linkStore";
import { LINK_TOKEN_HEADER } from "@/lib/constants";
import { ddbQueryAll } from "@/lib/dynamo";
import { pk } from "@/lib/keys";
import { badRequest, forbidden, success, unauthorized } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
  }

  const user = getUserFromEvent(event);
  if (!user) return unauthorized();
  
  const linkToken = normalizeHeader(event, LINK_TOKEN_HEADER);

  const isOwner = await ownerCanAccessWorkspace({ userId: user.userId, workspaceId });
  if (!isOwner) {
    // Signed-in contributor path: must also present a valid share link token.
    if (!linkToken) return forbidden("Workspace not found or not accessible");
    const link = await getShareLinkByToken(linkToken);
    if (!link) return unauthorized("Invalid share link token");
    if (link.workspaceId !== workspaceId) return forbidden("Share link is not valid for this workspace");
  }

  const items = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "COLUMN#" });
  const columns = items.map((i) => {
    const { PK: _pk, SK: _sk, ...rest } = i ?? {};
    return rest as Column;
  });

  return success({ workspaceId, columns });
};
