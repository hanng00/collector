"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, getAuthHeaders } from "@/features/collector/api/client";
import { useUploadFile } from "@/features/collector/api/use-upload-file";
import { useWorkspace } from "@/features/collector/api/use-workspace";
import { getBackendUrl } from "@/lib/config";
import { getPublicAppUrl } from "@/lib/constants";
import type { Workspace } from "@contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Link2, Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef } from "react";

export function WorkspaceTopbar() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data } = useWorkspace(workspaceId);
  const workspace: Workspace | undefined = data?.workspace;
  const descriptionsOk =
    !!workspace?.columns?.length &&
    workspace.columns.every((c) => (c.description ?? "").trim().length > 0);
  const missingCount =
    workspace?.columns?.filter(
      (c) => !c.description || c.description.trim().length === 0
    ).length ?? 0;

  const createShareLink = useMutation({
    mutationFn: async () => {
      if (!workspace) throw new Error("Workspace not loaded");
      const { data } = await apiClient.post(
        `/workspaces/${workspace.id}/share-links`,
        {},
        { headers: await getAuthHeaders() }
      );
      return data.link as { token: string };
    },
    onSuccess: async () => {
      if (!workspace) return;
      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspace.id],
      });
    },
  });

  const exportCsv = useMutation({
    mutationFn: async () => {
      if (!workspace) throw new Error("Workspace not loaded");
      const res = await fetch(
        `${getBackendUrl()}/workspaces/${workspace.id}/export`,
        {
          headers: await getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      return await res.text();
    },
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workspaceId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const uploadFile = useUploadFile(workspaceId);

  const copyShareLink = async () => {
    const shareToken = workspace?.shareLinks[0]?.token;
    const token = shareToken ?? (await createShareLink.mutateAsync()).token;
    const url = `${getPublicAppUrl()}/share/${token}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">
          {workspace?.name ?? "Workspace"}
        </div>
        {!descriptionsOk && workspace?.columns?.length ? (
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-destructive">
              {missingCount} column{missingCount === 1 ? "" : "s"} missing
              description{missingCount === 1 ? "" : "s"}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[11px]"
              onClick={() => {
                // Call the guided flow function exposed by WorkspaceGrid
                if ((window as any).__startGuidedFlow) {
                  (window as any).__startGuidedFlow();
                }
              }}
            >
              <FileText className="mr-1 size-3" />
              Fill descriptions
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          <Input
            readOnly
            value={
              workspace?.shareLinks[0]?.token
                ? `${getPublicAppUrl()}/share/${workspace.shareLinks[0].token}`
                : ""
            }
            placeholder="Share link"
            className="h-8 w-[360px] font-mono text-xs"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void copyShareLink()}
          disabled={createShareLink.isPending || !descriptionsOk}
        >
          <Link2 className="mr-2 size-4" />
          Copy link
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            uploadFile.mutate(file, {
              onSuccess: async () => {
                await queryClient.invalidateQueries({
                  queryKey: ["workspace", workspaceId],
                });
                await queryClient.invalidateQueries({
                  queryKey: ["rows", workspaceId],
                });
              },
            });
          }}
        />

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadFile.isPending || !descriptionsOk}
        >
          <Upload className="mr-2 size-4" />
          Upload
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => exportCsv.mutate()}
          disabled={exportCsv.isPending || !descriptionsOk}
        >
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
