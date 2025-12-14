"use client";

/**
 * Deprecated shim.
 *
 * Prefer importing from `@/features/auth/use-auth`.
 * This exists to avoid breaking any stale imports while we migrate.
 */
export {
  useAuth,
  useConfirmMagicLink as useConfirmSignInCode,
  useRequestMagicLink as useRequestSignInCode,
  useSignOut
} from "@/features/auth/use-auth";

