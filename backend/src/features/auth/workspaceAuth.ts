import { ddbGet } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";

export async function ownerCanAccessWorkspace({
  userId,
  ownerEmail,
  workspaceId,
}: {
  userId?: string;
  ownerEmail?: string;
  workspaceId: string;
}): Promise<boolean> {
  const ws = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
  if (!ws) return false;
  
  // Check by userId (Cognito) first, then fallback to email for backward compatibility
  if (userId && ws.ownerId) {
    return ws.ownerId === userId;
  }
  if (ownerEmail && ws.ownerEmail) {
    return ws.ownerEmail === ownerEmail;
  }
  
  // If workspace has no owner set, allow access (legacy workspaces)
  return !ws.ownerId && !ws.ownerEmail;
}


