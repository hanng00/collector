"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useWorkspace } from "@/features/collector/api/use-workspace";
import { WorkspaceFilesSidebar } from "@/features/collector/components/workspace-files-sidebar";
import { WorkspaceGrid } from "@/features/collector/components/workspace-grid";
import { useWorkspaceFilesSidebarVisibility } from "@/features/collector/state/workspace-ui";
import { useParams } from "next/navigation";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const { data } = useWorkspace(workspaceId);
  const { visible: filesSidebarVisible } = useWorkspaceFilesSidebarVisibility();

  const workspace = data?.workspace;
  const rows = data?.rows ?? [];
  const uploads = data?.uploads ?? [];

  return (
    <div className="h-full min-h-0 min-w-0 w-full overflow-hidden">
      {workspace ? (
        filesSidebarVisible ? (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={74} minSize={50} className="min-w-0">
              <div className="h-full min-w-0 overflow-hidden">
                <WorkspaceGrid
                  workspaceId={workspaceId}
                  columns={workspace.columns}
                  rows={rows}
                  canEdit
                  canEditSchema
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={26} minSize={16} maxSize={40} className="min-w-0">
              <WorkspaceFilesSidebar uploads={uploads} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full min-w-0 overflow-hidden">
            <WorkspaceGrid
              workspaceId={workspaceId}
              columns={workspace.columns}
              rows={rows}
              canEdit
              canEditSchema
            />
          </div>
        )
      ) : null}
    </div>
  );
}
