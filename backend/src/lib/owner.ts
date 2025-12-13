import { ddbGet } from "./dynamo";
import { pk, sk } from "./keys";

export type OwnerSessionItem = {
  PK: string;
  SK: string;
  ownerEmail: string;
  expiresAt: string;
};

export async function getOwnerEmailForToken(token: string): Promise<string | null> {
  const item = await ddbGet<OwnerSessionItem>({ PK: pk.ownerSession(token), SK: sk.metadata });
  if (!item) return null;
  if (item.expiresAt && Date.parse(item.expiresAt) < Date.now()) return null;
  return item.ownerEmail;
}


