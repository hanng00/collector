import { shareLinkSchema, workspaceSchema } from "@/contracts";
import { getUserFromEvent } from "@/features/auth/auth";
import { putLinkTokenIndex } from "@/features/links/linkStore";
import { ddbPut } from "@/lib/dynamo";
import { newId } from "@/lib/ids";
import { pk, sk } from "@/lib/keys";
import { created, unauthorized } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";

const payloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const user = getUserFromEvent(event);
  if (!user) return unauthorized("Authentication required");

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
    ownerId: user.userId,
    ownerEmail: user.email,
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
    PK: pk.owner(user.userId),
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
    ownerEmail: user.email,
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


