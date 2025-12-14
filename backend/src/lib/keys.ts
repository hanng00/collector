export const pk = {
  workspace: (workspaceId: string) => `WORKSPACE#${workspaceId}`,
  owner: (ownerId: string) => `OWNER#${ownerId}`, // Now uses Cognito user ID (sub)
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


