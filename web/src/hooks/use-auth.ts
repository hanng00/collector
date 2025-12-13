"use client";

import {
    getCurrentAuthUser,
    requestMagicLink,
    signOutUser,
    type AuthError,
    type User,
} from "@/lib/auth/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const AUTH_QUERY_KEY = ["auth", "user"];

/**
 * Hook to get the current authenticated user
 * Similar to Convex's useQuery pattern
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
 * Hook to request a magic link for the owner
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email }: { email: string }) => requestMagicLink(email),
    onSuccess: (_, { email }) => {
      queryClient.setQueryData<User>(AUTH_QUERY_KEY, {
        email,
        name: email,
      });
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

