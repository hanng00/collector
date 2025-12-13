import { getAuthContext } from "@/lib/auth";
import { ddbBatchGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { success, unauthorized } from "@/utils/response";
import { columnSchema, shareLinkSchema, workspaceSchema, type Workspace } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { ownerToken } = getAuthContext(event);
  if (!ownerToken) return unauthorized();
  const ownerEmail = await getOwnerEmailForToken(ownerToken);
  if (!ownerEmail) return unauthorized("Invalid owner token");

  const refs = await ddbQueryAll<any>({ PK: pk.owner(ownerEmail), beginsWithSK: "WORKSPACE#" });
  const workspaceIds = refs.map((r) => (r.workspaceId as string | undefined) ?? String(r.SK).replace("WORKSPACE#", ""));

  const metas = await ddbBatchGet<any>(
    workspaceIds.map((id) => ({ PK: pk.workspace(id), SK: sk.metadata }))
  );

  const workspaces: Workspace[] = [];
  for (const meta of metas) {
    const { PK: _pk, SK: _sk, ...rest } = meta ?? {};
    const workspaceId = rest.id as string;

    const colItems = await ddbQueryAll<any>({
      PK: pk.workspace(workspaceId),
      beginsWithSK: "COLUMN#",
    });

    // For the owner dashboard we attach share links (small N).
    const linkItems = await ddbQueryAll<any>({
      PK: pk.workspace(workspaceId),
      beginsWithSK: "LINK#",
    });
    const shareLinks = linkItems.map((i) => {
      const { PK: __pk, SK: __sk, ...lrest } = i ?? {};
      return shareLinkSchema.parse(lrest);
    });

    const ws = workspaceSchema.parse({
      ...rest,
      shareLinks,
      columns: colItems
        .map((c) => {
        const { PK: __pk, SK: __sk, ...crest } = c ?? {};
        return columnSchema.parse(crest);
        })
        .sort((a, b) => a.order - b.order),
    });
    workspaces.push(ws);
  }

  workspaces.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return success({ workspaces });
};


