"use client";

import { apiClient, getAuthHeaders } from "@/features/collector/api/client";
import { workspaceSchema, type Workspace } from "@contracts";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export function useOwnerWorkspaces() {
  return useQuery<{ workspaces: Workspace[] }>({
    queryKey: ["owner-workspaces"],
    queryFn: async () => {
      const { data } = await apiClient.get("/workspaces", { headers: await getAuthHeaders() });
      const workspaces = z.array(workspaceSchema).parse(data.workspaces ?? []);
      return { workspaces };
    },
    retry: false,
    staleTime: 30_000,
  });
}


