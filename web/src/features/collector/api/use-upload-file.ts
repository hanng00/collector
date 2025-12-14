"use client";

import { apiClient } from "@/features/collector/api/client";
import { uploadSchema } from "@contracts";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

export function useUploadFile(workspaceId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const { data } = await apiClient.post(`/workspaces/${workspaceId}/uploads`, {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      });

      const payload = z
        .object({
          upload: uploadSchema,
          signedUrl: z.string().url(),
        })
        .parse(data);

      const putRes = await fetch(payload.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }

      return payload.upload.id;
    },
  });
}

