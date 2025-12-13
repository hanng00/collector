import { getAuthContext } from "@/lib/auth";
import { ddbPut } from "@/lib/dynamo";
import { newId } from "@/lib/ids";
import { pk, sk } from "@/lib/keys";
import { getOwnerEmailForToken } from "@/lib/owner";
import { created, unauthorized } from "@/utils/response";
import { shareLinkSchema, workspaceSchema } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";
import { putLinkTokenIndex } from "@/features/links/linkStore";

const payloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { ownerToken } = getAuthContext(event);
  if (!ownerToken) return unauthorized();
  const ownerEmail = await getOwnerEmailForToken(ownerToken);
  if (!ownerEmail) return unauthorized("Invalid owner token");

  const body = JSON.parse(event.body ?? "{}");
  const { name, description } = payloadSchema.parse(body);

  const workspaceId = newId("ws");
  const now = new Date().toISOString();

  const linkId = newId("lnk");
  const token = newId("share");

  const link = shareLinkSchema.parse({
    id: linkId,
    workspaceId,
    token,
    status: "active",
    passcodeRequired: false,
    permissions: { canUpload: true, canEditRows: true },
    lastUsedAt: undefined,
  });

  await ddbPut({
    PK: pk.workspace(workspaceId),
    SK: sk.metadata,
    id: workspaceId,
    name,
    description,
    ownerEmail,
    createdAt: now,
    status: "active",
    limits: {
      columns: 50,
      rows: 10_000,
      uploads: 5_000,
      maxUploadSizeMb: 25,
    },
  });

  // Owner -> workspace mapping for listing.
  await ddbPut({
    PK: pk.owner(ownerEmail),
    SK: sk.workspaceRef(workspaceId),
    workspaceId,
    createdAt: now,
  });

  // Seed initial share link.
  await ddbPut({
    PK: pk.workspace(workspaceId),
    SK: sk.link(linkId),
    ...link,
  });
  await putLinkTokenIndex({ workspaceId, linkId, token });

  const workspace = workspaceSchema.parse({
    id: workspaceId,
    name,
    description,
    ownerEmail,
    createdAt: now,
    status: "active",
    limits: {
      columns: 50,
      rows: 10_000,
      uploads: 5_000,
      maxUploadSizeMb: 25,
    },
    columns: [],
    shareLinks: [link],
  });

  return created({ workspace });
};


