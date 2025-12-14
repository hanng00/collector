"use client";

import {
    rowSchema,
    uploadSchema,
    workspaceSchema,
    type Row,
    type Upload,
    type Workspace,
} from "@contracts";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, getAuthHeaders } from "./client";

type WorkspacePayload = {
  workspace: Workspace;
  uploads: Upload[];
  rows: Row[];
};

export function useWorkspace(workspaceId: string) {
  return useQuery<WorkspacePayload>({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error("Missing workspaceId");

      const { data } = await apiClient.get(`/workspaces/${workspaceId}`, {
        headers: await getAuthHeaders(),
      });

      const workspace = workspaceSchema.parse(data.workspace ?? data);
      const uploads = z.array(uploadSchema).parse(data.uploads ?? []);
      const rows = z.array(rowSchema).parse(data.rows ?? []);

      return { workspace, uploads, rows };
    },
    retry: false,
    staleTime: 30_000,
  });
}
