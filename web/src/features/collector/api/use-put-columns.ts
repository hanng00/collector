"use client";

import { apiClient, getAuthHeaders } from "@/features/collector/api/client";
import { columnSchema, type Column } from "@contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export function usePutColumns(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columns: Column[]) => {
      const normalized = z.array(columnSchema).parse(columns);
      const { data } = await apiClient.put(
        `/workspaces/${workspaceId}/columns`,
        { columns: normalized },
        { headers: await getAuthHeaders() }
      );
      return z
        .object({
          workspaceId: z.string(),
          columns: z.array(columnSchema),
        })
        .parse(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
  });
}

