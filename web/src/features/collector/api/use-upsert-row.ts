"use client";

import { rowSchema, type Row } from "@contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

export type UpsertRowInput = {
  workspaceId: string;
  rowId: string;
  row: Omit<Partial<Row>, "workspaceId" | "id"> & {
    values: Row["values"];
  };
};

export function useUpsertRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, rowId, row }: UpsertRowInput) => {
      const { data } = await apiClient.put(`/workspaces/${workspaceId}/rows/${rowId}`, {
        row: { ...row, id: rowId },
      });
      return rowSchema.parse(data.row);
    },
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ["rows", row.workspaceId] });
      await queryClient.invalidateQueries({ queryKey: ["workspace", row.workspaceId] });
    },
  });
}
