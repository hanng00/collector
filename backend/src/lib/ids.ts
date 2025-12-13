import { randomBytes } from "node:crypto";

export function newId(prefix: string) {
  // 128-bit entropy, url-safe.
  const suffix = randomBytes(16).toString("base64url");
  return `${prefix}-${suffix}`;
}


