import { ddbGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { badRequest, notFound, success } from "@/utils/response";
import { columnSchema, uploadSchema, workspaceSchema } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { getShareLinkByToken, touchShareLinkLastUsedAt } from "./linkStore";

export const handler: APIGatewayProxyHandler = async (event) => {
  const token = event.pathParameters?.token;
  if (!token) {
    return badRequest("token is required");
  }

  const link = await getShareLinkByToken(token);
  if (!link) return notFound("Share link not found or expired");

  await touchShareLinkLastUsedAt({ workspaceId: link.workspaceId, linkId: link.id });

  const wsItem = await ddbGet<any>({ PK: pk.workspace(link.workspaceId), SK: sk.metadata });
  if (!wsItem) return notFound("Workspace not found");
  const { PK: _pk, SK: _sk, ...wsRest } = wsItem;

  const columnItems = await ddbQueryAll<any>({
    PK: pk.workspace(link.workspaceId),
    beginsWithSK: "COLUMN#",
  });
  const columns = columnItems
    .map((i) => {
      const { PK: __pk, SK: __sk, ...rest } = i ?? {};
      return columnSchema.parse(rest);
    })
    .sort((a, b) => a.order - b.order);

  const uploadItems = await ddbQueryAll<any>({
    PK: pk.workspace(link.workspaceId),
    beginsWithSK: "UPLOAD#",
  });
  const uploadsForLink = uploadItems
    .map((i) => {
      const { PK: __pk, SK: __sk, ...rest } = i ?? {};
      return uploadSchema.safeParse(rest).success ? uploadSchema.parse(rest) : null;
    })
    .filter(Boolean) as any[];

  const latestUpload = uploadsForLink
    .filter((u) => u.linkId === link.id)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];

  const workspace = workspaceSchema.parse({
    ...wsRest,
    id: link.workspaceId,
    columns,
    shareLinks: [link],
  });

  return success({
    workspace,
    link,
    columns,
    latestUpload,
  });
};
