import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type TokenState = {
  ownerToken?: string;
  linkToken?: string;
  backendUrl?: string;
  updatedAt: string;
};

const dir = join(homedir(), ".datacolab");
const file = join(dir, "tokens.json");

export function readTokens(): TokenState | null {
  try {
    const raw = readFileSync(file, "utf8");
    return JSON.parse(raw) as TokenState;
  } catch {
    return null;
  }
}

export function writeTokens(next: Omit<TokenState, "updatedAt">) {
  mkdirSync(dir, { recursive: true });
  const payload: TokenState = { ...next, updatedAt: new Date().toISOString() };
  writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  return { file, payload };
}


