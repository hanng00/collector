import { getAuthContext } from "@/lib/auth";
import { ddbQueryAll } from "@/lib/dynamo";
import { pk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { ownerCanAccessWorkspace } from "@/lib/workspaceAuth";
import { getShareLinkByToken } from "@/features/links/linkStore";
import { badRequest, forbidden, success, unauthorized } from "@/utils/response";
import type { Row } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
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

  const items = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "ROW#" });
  const rows = items.map((i) => {
    const { PK: _pk, SK: _sk, ...rest } = i ?? {};
    return rest as Row;
  });

  return success({ workspaceId, rows });
};
