"use client";

import { useWorkspace } from "@/features/collector/api/use-workspace";
import { UploadDropzone } from "@/features/collector/components/upload-dropzone";
import { UploadsCard } from "@/features/collector/components/uploads-card";
import { WorkspaceColumns } from "@/features/collector/components/workspace-columns";
import { WorkspaceHeader } from "@/features/collector/components/workspace-header";
import { useParams } from "next/navigation";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const { data } = useWorkspace(workspaceId);

  const workspace = data?.workspace;
  const uploads = data?.uploads ?? [];

  return (
    <div className="space-y-6">
      {workspace && <WorkspaceHeader workspace={workspace} />}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <WorkspaceColumns workspaceId={workspaceId} columns={workspace?.columns ?? []} />
        <div className="space-y-4">
          <UploadDropzone
            workspaceId={workspaceId}
            onUploaded={() => {
              // The workspace query will refresh soon via React Query's background refetch.
            }}
          />
          <UploadsCard uploads={uploads} />
        </div>
      </div>
    </div>
  );
}
