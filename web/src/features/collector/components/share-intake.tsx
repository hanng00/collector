"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SHARE_TOKEN_KEY } from "@/features/auth/config";
import { useRows } from "@/features/collector/api/use-rows";
import type { ShareView } from "@contracts";
import Link from "next/link";
import { WorkspaceGrid } from "./workspace-grid";

type ShareIntakeProps = {
  view: ShareView;
};

export function ShareIntake({ view }: ShareIntakeProps) {
  // Ensure the auth interceptor has the link token before we call row APIs.
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(SHARE_TOKEN_KEY) !== view.link.token) {
        sessionStorage.setItem(SHARE_TOKEN_KEY, view.link.token);
      }
    } catch {
      // If storage is unavailable, row APIs may not work; the share view still renders.
    }
  }

  const rowsEnabled =
    typeof window !== "undefined" &&
    (() => {
      try {
        return sessionStorage.getItem(SHARE_TOKEN_KEY) === view.link.token;
      } catch {
        return false;
      }
    })();

  const { data } = useRows(view.workspace.id, { enabled: rowsEnabled });
  const rows = data?.rows ?? [];

  return (
    <div className="h-[calc(100vh-6rem)]">
      <WorkspaceGrid
        workspaceId={view.workspace.id}
        columns={view.columns}
        rows={rows}
        contributorLinkId={view.link.id}
        canEdit={view.link.permissions.canEditRows}
        autoCreateRow
        autoFocusFirstCell
      />

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Need to collect data too?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Create your own request in minutes and share a link.
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/workspaces/new">Create your own workspace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
