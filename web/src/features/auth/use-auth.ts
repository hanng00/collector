"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmMagicLink,
  getCurrentAuthUser,
  requestMagicLink,
  signOutUser,
  type AuthError,
  type User,
} from "./client";

const AUTH_QUERY_KEY = ["auth", "user"];

/**
 * Hook to get the current authenticated user
 */
export function useAuth() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentAuthUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to request a magic link (sends OTP code to email)
 */
export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email: string) => requestMagicLink(email),
  });
}

/**
 * Hook to confirm magic link with OTP code
 */
export function useConfirmMagicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => 
      confirmMagicLink(email, code),
    onSuccess: (user) => {
      queryClient.setQueryData<User>(AUTH_QUERY_KEY, user);
    },
    onError: (error: AuthError) => {
      // Clear auth cache on error
      queryClient.setQueryData<User | null>(AUTH_QUERY_KEY, null);
      throw error;
    },
  });
}

/**
 * Hook to sign out a user
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      // Clear the auth query cache
      queryClient.setQueryData<User | null>(AUTH_QUERY_KEY, null);
    },
  });
}

