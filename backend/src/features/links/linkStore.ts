import type { ShareLink } from "@/contracts";
import { ddbGet, ddbPut, ddbUpdate } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";

type LinkTokenIndexItem = {
  PK: string;
  SK: string;
  workspaceId: string;
  linkId: string;
  token: string;
};

export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  // Public, stable demo token used for marketing.
  if (token === "demo-token") {
    return {
      id: "lnk_demo",
      workspaceId: "ws_demo",
      token: "demo-token",
      passcodeRequired: false,
      status: "active",
      permissions: {
        // Keep this safe: demo should be view-only.
        canUpload: false,
        canEditRows: false,
      },
    };
  }

  const idx = await ddbGet<LinkTokenIndexItem>({ PK: pk.linkToken(token), SK: sk.metadata });
  if (!idx) return null;

  const link = await ddbGet<ShareLink & { PK: string; SK: string }>({
    PK: pk.workspace(idx.workspaceId),
    SK: sk.link(idx.linkId),
  });
  if (!link) return null;

  if (link.status === "revoked") return null;
  if (link.expiresAt && Date.parse(link.expiresAt) < Date.now()) return null;
  return link;
}

export async function touchShareLinkLastUsedAt({
  workspaceId,
  linkId,
}: {
  workspaceId: string;
  linkId: string;
}) {
  await ddbUpdate({
    key: { PK: pk.workspace(workspaceId), SK: sk.link(linkId) },
    updateExpression: "SET lastUsedAt = :t",
    expressionAttributeValues: { ":t": new Date().toISOString() },
  });
}

export async function putLinkTokenIndex({
  workspaceId,
  linkId,
  token,
}: {
  workspaceId: string;
  linkId: string;
  token: string;
}) {
  await ddbPut({
    PK: pk.linkToken(token),
    SK: sk.metadata,
    workspaceId,
    linkId,
    token,
  });
}


