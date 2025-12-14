"use client";

import { shareViewSchema, type ShareView } from "@contracts";
import { useQuery } from "@tanstack/react-query";
import { apiClient, getAuthHeaders } from "./client";

export function useShareView(linkId: string) {
  return useQuery<ShareView>({
    queryKey: ["share-view", linkId],
    queryFn: async () => {
      if (!linkId) throw new Error("Missing linkId");
      const { data } = await apiClient.get(`/share-links/${linkId}`, {
        headers: await getAuthHeaders(),
      });
      return shareViewSchema.parse(data);
    },
    retry: false,
    staleTime: 15_000,
  });
}
