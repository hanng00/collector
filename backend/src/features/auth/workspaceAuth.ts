import { ddbGet } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";

export async function ownerCanAccessWorkspace({
  userId,
  ownerEmail,
  workspaceId,
  workspace,
}: {
  userId?: string;
  ownerEmail?: string;
  workspaceId: string;
  workspace?: { ownerId?: string; ownerEmail?: string } | null;
}): Promise<boolean> {
  const ws =
    workspace ??
    (await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata }));
  if (!ws) return false;

  // If the workspace has a Cognito ownerId set, require matching userId.
  if (ws.ownerId) {
    if (!userId) return false;
    return ws.ownerId === userId;
  }

  // Otherwise, if the workspace is owned by email (legacy), require matching email.
  if (ws.ownerEmail) {
    if (!ownerEmail) return false;
    return ws.ownerEmail === ownerEmail;
  }

  // If workspace has no owner set, allow access (legacy/public workspaces)
  return true;
}


