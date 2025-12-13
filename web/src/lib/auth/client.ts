"use client";

import { OWNER_EMAIL_KEY, OWNER_TOKEN_KEY } from "./config";
import { getBackendUrl } from "@/lib/config";

export interface User {
  email: string;
  name?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

const isBrowser = typeof window !== "undefined";

const persistOwnerSession = (email: string, token: string) => {
  if (!isBrowser) {
    return;
  }
  localStorage.setItem(OWNER_EMAIL_KEY, email);
  localStorage.setItem(OWNER_TOKEN_KEY, token);
};

const encodeToken = (email: string) => {
  if (!isBrowser) {
    return `owner-${email}`;
  }
  const encoded = btoa(unescape(encodeURIComponent(email)));
  return `owner-${encoded}`;
};

/**
 * Request a magic link. Stores the returned owner token for subsequent API calls.
 */
export async function requestMagicLink(
  email: string
): Promise<{ delivered: boolean; token: string }> {
  const res = await fetch(`${getBackendUrl()}/auth/magic-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw { message: `Failed to request magic link (${res.status})` } satisfies AuthError;
  }
  const data = (await res.json()) as { token?: string };
  const token = data.token ?? encodeToken(email);
  persistOwnerSession(email, token);
  return { delivered: true, token };
}

/**
 * Sign out the current owner.
 */
export async function signOutUser(): Promise<void> {
  if (!isBrowser) {
    return;
  }
  localStorage.removeItem(OWNER_EMAIL_KEY);
  localStorage.removeItem(OWNER_TOKEN_KEY);
}

/**
 * Get the current authenticated owner (if a local token exists).
 */
export async function getCurrentAuthUser(): Promise<User | null> {
  if (!isBrowser) {
    return null;
  }
  const email = localStorage.getItem(OWNER_EMAIL_KEY);
  if (!email) {
    return null;
  }

  return {
    email,
    name: email,
  };
}

