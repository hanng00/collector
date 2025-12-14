"use client";

import {
    autoSignIn,
    confirmSignIn,
    confirmSignUp,
    fetchAuthSession,
    getCurrentUser,
    signIn,
    signOut,
    signUp,
} from "aws-amplify/auth";
import { configureAmplify } from "./amplify";

export interface User {
  email: string;
  name?: string;
  userId: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

const isBrowser = typeof window !== "undefined";

const PENDING_AUTH_MODE_KEY = "dc_pending_auth_mode";
type PendingAuthMode = "signin" | "signup";

const SIGN_UP_CODE_LENGTH = 6;
const SIGN_IN_CODE_LENGTH = 8;

async function ensureSignedOut(): Promise<void> {
  if (!isBrowser) return;
  configureAmplify();
  try {
    // signOut() is idempotent-ish; if no user is signed in it may throw, so swallow.
    await signOut();
  } catch {
    // ignore
  }
}

function generateEphemeralPassword(): string {
  // Cognito's password policy is configurable. This aims to satisfy the common
  // defaults (min length + upper/lower/number/symbol) without storing anything.
  // If the pool has a stricter policy, surface the error to the user.
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    // Extremely unlikely in modern browsers, but keep a deterministic fallback.
    return `Dc!${Date.now()}Aa1`;
  }

  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let body = "";
  for (const b of bytes) body += alphabet[b % alphabet.length];

  // Ensure all categories are present (and length >= 12).
  return `${body}aA1!`;
}

function isUsernameExistsError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; name?: string; __type?: string; errorType?: string };
  const id = err?.code ?? err?.name ?? err?.__type ?? err?.errorType;
  return (
    id === "UsernameExistsException"
  );
}

function isAlreadySignedInError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; name?: string };
  const msg = (err?.message ?? "").toLowerCase();
  return msg.includes("already a signed in user") || msg.includes("already signed in user");
}

/**
 * Request a sign-in code.
 *
 * - **New users**: create account (ephemeral password) and let Cognito send the 6-digit
 *   sign-up confirmation code.
 * - **Existing users**: sign in with Cognito's native EMAIL_OTP (8 digits).
 */
export async function requestMagicLink(email: string): Promise<void> {
  if (!isBrowser) {
    throw { message: "Magic link is only available in the browser" } satisfies AuthError;
  }

  configureAmplify();
  // If the browser still has an active session, Amplify can refuse to start a new sign-in.
  // For this email-code flow we always treat the request as a fresh auth attempt.
  await ensureSignedOut();

  try {
    // Important: with PreventUserExistenceErrors enabled, Cognito can respond with
    // the same "email code" nextStep even when the user does not exist, but no
    // email will be delivered. To avoid this confusing UX, we try sign-up first,
    // then fall back to sign-in when the username already exists.
    //
    // 1) First-time user path: create account (ephemeral password), then confirm via email.
    try {
      const { nextStep } = await signUp({
        username: email,
        password: generateEphemeralPassword(),
        options: {
          userAttributes: { email },
          autoSignIn: true,
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        sessionStorage.setItem(PENDING_AUTH_MODE_KEY, "signup" satisfies PendingAuthMode);
        return;
      }

      if (nextStep.signUpStep === "DONE") {
        // Some pools auto-confirm / auto-verify. Still initiate sign-in so the user gets a code.
        const { nextStep: signInStep } = await signIn({
          username: email,
          options: {
            authFlowType: "USER_AUTH",
            preferredChallenge: "EMAIL_OTP",
          },
        });

        if (signInStep.signInStep === "CONFIRM_SIGN_IN_WITH_EMAIL_CODE") {
          sessionStorage.setItem(PENDING_AUTH_MODE_KEY, "signin" satisfies PendingAuthMode);
          return;
        }

        throw {
          message: `Unexpected sign-in step: ${signInStep.signInStep}. Please try again.`,
        } satisfies AuthError;
      }

      throw {
        message: `Unexpected sign-up step: ${nextStep.signUpStep}. Please try again.`,
      } satisfies AuthError;
    } catch (error: unknown) {
      // Only fall back to sign-in if the user already exists. Otherwise, surface
      // the sign-up error (e.g. password policy issues) so new users can proceed.
      if (!isUsernameExistsError(error)) {
        throw error;
      }

      // 2) Existing user path: sign-in with EMAIL_OTP.
      let nextStep:
        | Awaited<ReturnType<typeof signIn>>["nextStep"]
        | undefined;
      try {
        ({ nextStep } = await signIn({
          username: email,
          options: {
            authFlowType: "USER_AUTH",
            preferredChallenge: "EMAIL_OTP",
          },
        }));
      } catch (e: unknown) {
        // Common when an old session exists in storage.
        if (isAlreadySignedInError(e)) {
          await ensureSignedOut();
          ({ nextStep } = await signIn({
            username: email,
            options: {
              authFlowType: "USER_AUTH",
              preferredChallenge: "EMAIL_OTP",
            },
          }));
        } else {
          throw e;
        }
      }

      if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_EMAIL_CODE") {
        sessionStorage.setItem(PENDING_AUTH_MODE_KEY, "signin" satisfies PendingAuthMode);
        return;
      }

      throw {
        message: `Unexpected sign-in step: ${nextStep.signInStep}. Please try again.`,
      } satisfies AuthError;
    }
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err.message) {
      throw { message: err.message, code: err.code } satisfies AuthError;
    }
    throw { message: "Failed to send sign-in code" } satisfies AuthError;
  }
}

/**
 * Confirm sign-in with OTP code from email.
 */
export async function confirmMagicLink(email: string, code: string): Promise<User> {
  if (!isBrowser) {
    throw { message: "Confirmation is only available in the browser" } satisfies AuthError;
  }

  const trimmed = code.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw { message: "Please enter the numeric code from your email." } satisfies AuthError;
  }

  configureAmplify();

  try {
    const mode = (sessionStorage.getItem(PENDING_AUTH_MODE_KEY) ?? "signin") as PendingAuthMode;

    // If we previously started a sign-up flow, confirm sign-up and auto-sign-in.
    if (mode === "signup") {
      if (trimmed.length !== SIGN_UP_CODE_LENGTH) {
        throw {
          message: `Please enter the ${SIGN_UP_CODE_LENGTH}-digit code from your email.`,
        } satisfies AuthError;
      }
      await confirmSignUp({ username: email, confirmationCode: trimmed });
      try {
        await ensureSignedOut();
        await autoSignIn();
      } finally {
        sessionStorage.removeItem(PENDING_AUTH_MODE_KEY);
      }

      const user = await getCurrentAuthUser();
      if (!user) {
        throw new Error("Failed to get user after sign in");
      }
      return user;
    }

    // Prefer confirming an in-flight sign-in (from requestMagicLink).
    // If the app refreshes between steps, we'll re-initiate and then confirm.
    try {
      if (trimmed.length !== SIGN_IN_CODE_LENGTH) {
        throw {
          message: `Please enter the ${SIGN_IN_CODE_LENGTH}-digit code from your email.`,
        } satisfies AuthError;
      }
      const { isSignedIn } = await confirmSignIn({ challengeResponse: trimmed });
      if (!isSignedIn) {
        throw { message: "Invalid code. Please try again." } satisfies AuthError;
      }
    } catch (e: unknown) {
      // Attempt to recover by starting a new email-OTP sign-in session.
      const err = e as { message?: string; code?: string };
      if (isAlreadySignedInError(e)) {
        await ensureSignedOut();
      }
      await signIn({
        username: email,
        options: {
          authFlowType: "USER_AUTH",
          preferredChallenge: "EMAIL_OTP",
        },
      });
      const { isSignedIn } = await confirmSignIn({ challengeResponse: trimmed });
      if (!isSignedIn) {
        throw { message: err.message || "Invalid code. Please try again.", code: err.code } satisfies AuthError;
      }
    }

    sessionStorage.removeItem(PENDING_AUTH_MODE_KEY);
    const user = await getCurrentAuthUser();
    if (!user) {
      throw new Error("Failed to get user after sign in");
    }
    return user;
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err.message) {
      throw { message: err.message, code: err.code } satisfies AuthError;
    }
    throw { message: "Failed to confirm magic link" } satisfies AuthError;
  }
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  if (!isBrowser) {
    return;
  }
  configureAmplify();
  try {
    await signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }
}

/**
 * Get the current authenticated user.
 */
export async function getCurrentAuthUser(): Promise<User | null> {
  if (!isBrowser) {
    return null;
  }

  configureAmplify();

  try {
    const cognitoUser = await getCurrentUser();
    const session = await fetchAuthSession();
    
    if (!cognitoUser || !session.tokens) {
      return null;
    }

    const email = cognitoUser.signInDetails?.loginId || cognitoUser.username;
    const userId = cognitoUser.userId;

    if (!email || typeof email !== "string" || !userId || typeof userId !== "string") {
      return null;
    }

    return {
      email,
      userId,
      name: email,
    };
  } catch {
    // User is not signed in
    return null;
  }
}

/**
 * Get the current user's JWT access token for API calls.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!isBrowser) {
    return null;
  }

  configureAmplify();

  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    return null;
  }
}

