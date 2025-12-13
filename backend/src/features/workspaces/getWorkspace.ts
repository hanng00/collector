import { getAuthContext } from "@/lib/auth";
import { ddbGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { forbidden, notFound, success, unauthorized } from "@/utils/response";
import {
  columnSchema,
  rowSchema,
  shareLinkSchema,
  uploadSchema,
  workspaceSchema,
} from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) return notFound("Workspace not found");

  const { ownerToken } = getAuthContext(event);
  if (!ownerToken) return unauthorized();
  const ownerEmail = await getOwnerEmailForToken(ownerToken);
  if (!ownerEmail) return unauthorized("Invalid owner token");

  const wsItem = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
  if (!wsItem) return notFound("Workspace not found");
  if (wsItem.ownerEmail && wsItem.ownerEmail !== ownerEmail) return forbidden("Not workspace owner");

  const colItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "COLUMN#" });
  const columns = colItems
    .map((i) => {
      const { PK: _pk, SK: _sk, ...rest } = i ?? {};
      return columnSchema.parse(rest);
    })
    .sort((a, b) => a.order - b.order);

  const linkItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "LINK#" });
  const shareLinks = linkItems.map((i) => {
    const { PK: _pk, SK: _sk, ...rest } = i ?? {};
    return shareLinkSchema.parse(rest);
  });

  const rowItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "ROW#" });
  const rows = rowItems.map((i) => {
    const { PK: _pk, SK: _sk, ...rest } = i ?? {};
    return rowSchema.parse(rest);
  });

  const uploadItems = await ddbQueryAll<any>({ PK: pk.workspace(workspaceId), beginsWithSK: "UPLOAD#" });
  const uploads = uploadItems.map((i) => {
    const { PK: _pk, SK: _sk, ...rest } = i ?? {};
    return uploadSchema.parse(rest);
  });

  const { PK: _pk, SK: _sk, ...wsRest } = wsItem;
  const workspace = workspaceSchema.parse({
    ...wsRest,
    columns,
    shareLinks,
  });

  return success({ workspace, rows, uploads });
};


