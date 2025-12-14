import type { Column, Row } from "@contracts";

export type DataGridPorts = {
  onUpsertRow?: (args: {
    workspaceId: string;
    rowId: string;
    row: {
      values: Row["values"];
      status: Row["status"];
      linkId?: string;
      createdByLinkId?: string;
    };
  }) => Promise<unknown>;

  onPutColumns?: (columns: Column[]) => Promise<unknown>;

  onUploadFile?: (file: File) => Promise<string>;
};

export type DataGridProps = {
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

  ports?: DataGridPorts;
};

