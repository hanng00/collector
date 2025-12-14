"use client";

import { useWorkspace } from "@/features/collector/api/use-workspace";
import { WorkspaceGrid } from "@/features/collector/components/workspace-grid";
import { useParams } from "next/navigation";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const { data } = useWorkspace(workspaceId);

  const workspace = data?.workspace;
  const rows = data?.rows ?? [];

  return (
    <div className="h-full">
      {workspace ? (
        <WorkspaceGrid
          workspaceId={workspaceId}
          columns={workspace.columns}
          rows={rows}
          canEdit
          canEditSchema
        />
      ) : null}
    </div>
  );
}
