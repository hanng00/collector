"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient, getAuthHeaders } from "@/features/collector/api/client";
import { getBackendUrl } from "@/lib/config";
import { getPublicAppUrl } from "@/lib/constants";
import type { Workspace } from "@contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type WorkspaceHeaderProps = {
  workspace: Workspace;
  rowsCount?: number;
  uploadsCount?: number;
  lastActivityAt?: string;
};

export function WorkspaceHeader({
  workspace,
  rowsCount,
  uploadsCount,
  lastActivityAt,
}: WorkspaceHeaderProps) {
  const queryClient = useQueryClient();
  const shareToken = workspace.shareLinks[0]?.token;
  const shareUrl = shareToken
    ? `${
        process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000"
      }/share/${shareToken}`
    : "Share link not issued";

  const createShareLink = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `/workspaces/${workspace.id}/share-links`,
        {},
        { headers: await getAuthHeaders() }
      );
      return data.link as { token: string };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspace.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["owner-workspaces"] });
    },
  });

  const copyShareLink = async () => {
    const token = shareToken ?? (await createShareLink.mutateAsync()).token;
    const url = `${
      getPublicAppUrl()
    }/share/${token}`;
    await navigator.clipboard.writeText(url);
  };

  const exportCsv = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${getBackendUrl()}/workspaces/${workspace.id}/export`,
        {
          headers: await getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const text = await res.text();
      return text;
    },
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workspace.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-2xl">{workspace.name}</CardTitle>
          <p className="text-muted-foreground">{workspace.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{workspace.columns.length} columns</Badge>
            <Badge variant="outline">
              {workspace.shareLinks.length} share links
            </Badge>
            {typeof rowsCount === "number" && (
              <Badge variant="outline">{rowsCount} rows</Badge>
            )}
            {typeof uploadsCount === "number" && (
              <Badge variant="outline">{uploadsCount} files</Badge>
            )}
            {workspace.limits && (
              <Badge variant="outline">
                {workspace.limits.maxUploadSizeMb} MB max upload
              </Badge>
            )}
            {lastActivityAt && (
              <Badge variant="outline">
                Last activity {new Date(lastActivityAt).toLocaleString()}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => createShareLink.mutate()}
            disabled={createShareLink.isPending}
          >
            New share link
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="share-url">Request link (no signup needed)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="share-url"
            readOnly
            value={shareUrl}
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            disabled={createShareLink.isPending}
          >
            Copy
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Anyone with this link can add data and upload files—no account needed.
          (Passcode protection coming soon.)
        </p>
      </CardContent>
    </Card>
  );
}
