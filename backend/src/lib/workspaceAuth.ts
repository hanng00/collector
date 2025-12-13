import { ddbGet } from "./dynamo";
import { pk, sk } from "./keys";

export async function ownerCanAccessWorkspace({
  ownerEmail,
  workspaceId,
}: {
  ownerEmail: string;
  workspaceId: string;
}): Promise<boolean> {
  const ws = await ddbGet<any>({ PK: pk.workspace(workspaceId), SK: sk.metadata });
  if (!ws) return false;
  if (ws.ownerEmail && ws.ownerEmail !== ownerEmail) return false;
  return true;
}


