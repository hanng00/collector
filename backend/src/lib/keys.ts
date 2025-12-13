export const pk = {
  workspace: (workspaceId: string) => `WORKSPACE#${workspaceId}`,
  owner: (ownerEmail: string) => `OWNER#${ownerEmail}`,
  ownerSession: (token: string) => `OWNERSESSION#${token}`,
  linkToken: (token: string) => `LINKTOKEN#${token}`,
};

export const sk = {
  metadata: "METADATA",
  workspaceRef: (workspaceId: string) => `WORKSPACE#${workspaceId}`,
  column: (columnId: string) => `COLUMN#${columnId}`,
  row: (rowId: string) => `ROW#${rowId}`,
  upload: (uploadId: string) => `UPLOAD#${uploadId}`,
  link: (linkId: string) => `LINK#${linkId}`,
};


