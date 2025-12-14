"use client";

import { usePutColumns } from "@/features/collector/api/use-put-columns";
import { useUploadFile } from "@/features/collector/api/use-upload-file";
import { useUpsertRow } from "@/features/collector/api/use-upsert-row";
import { DataGrid, type DataGridPorts } from "@/features/data-grid/components/data-grid";
import type { Column, Row } from "@contracts";
import { useMemo } from "react";

export type WorkspaceGridProps = {
  workspaceId: string;
  columns: Column[];
  rows: Row[];

  contributorLinkId?: string;

  canEdit?: boolean;
  canEditSchema?: boolean;
  autoCreateRow?: boolean;
  autoFocusFirstCell?: boolean;

  onUploaded?: (uploadId: string) => void;
  onStartGuidedFlow?: () => void;
};

export function WorkspaceGrid(props: WorkspaceGridProps) {
  const upsertRow = useUpsertRow();
  const putColumns = usePutColumns(props.workspaceId);
  const uploadFile = useUploadFile(props.workspaceId);

  const ports = useMemo<DataGridPorts>(
    () => ({
      onUpsertRow: async (args) => {
        await upsertRow.mutateAsync(args);
      },
      onPutColumns: async (cols) => {
        await putColumns.mutateAsync(cols);
      },
      onUploadFile: (file) => uploadFile.mutateAsync(file),
    }),
    [putColumns, uploadFile, upsertRow]
  );

  return <DataGrid {...props} ports={ports} />;
}

