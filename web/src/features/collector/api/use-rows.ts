"use client";

import { rowSchema, type Row } from "@contracts";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient } from "./client";

type RowsPayload = {
  workspaceId: string;
  rows: Row[];
};

export function useRows(workspaceId: string, opts?: { enabled?: boolean; mode?: "owner" | "share" }) {
  return useQuery<RowsPayload>({
    queryKey: ["rows", workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error("Missing workspaceId");
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/rows`);
      const rows = z.array(rowSchema).parse(data.rows ?? []);
      return { workspaceId, rows };
    },
    enabled: opts?.enabled ?? Boolean(workspaceId),
    retry: false,
    staleTime: 15_000,
  });
}
