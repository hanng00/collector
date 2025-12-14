import { z } from "zod";

export const columnTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "enum",
  "attachment",
  "email",
  "url",
  "money",
  "json",
]);

export const columnSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().default(""),
  type: columnTypeSchema,
  required: z.boolean().default(false),
  order: z.number().int(),
  enumValues: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  hint: z.string().optional(),
});

export const uploadStatusSchema = z.enum([
  "pending",
  "processing",
  "succeeded",
  "partial",
  "failed",
]);

export const uploadSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  rowId: z.string().optional(),
  linkId: z.string().optional(),
  fileName: z.string(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  uploadedBy: z.string().optional(),
  status: uploadStatusSchema,
  s3Key: z.string().optional(),
  parsedFields: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  errors: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const shareLinkSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  token: z.string(),
  expiresAt: z.string().optional(),
  passcodeRequired: z.boolean().default(false),
  status: z.enum(["active", "revoked", "expired"]).default("active"),
  permissions: z.object({
    canUpload: z.boolean().default(true),
    canEditRows: z.boolean().default(true),
  }),
  lastUsedAt: z.string().optional(),
});

export const rowCellValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const rowSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  linkId: z.string().optional(),
  values: z.record(z.string(), rowCellValueSchema),
  status: z.enum(["draft", "submitted", "parsed"]).default("draft"),
  createdAt: z.string(),
  createdByLinkId: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const workspaceLimitsSchema = z.object({
  columns: z.number().int(),
  rows: z.number().int(),
  uploads: z.number().int(),
  maxUploadSizeMb: z.number().int(),
});

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerEmail: z.string().email().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  status: z.enum(["active", "archived"]).default("active"),
  limits: workspaceLimitsSchema.optional(),
  columns: z.array(columnSchema).default([]),
  shareLinks: z.array(shareLinkSchema).default([]),
});

export const shareViewSchema = z.object({
  workspace: workspaceSchema,
  link: shareLinkSchema,
  columns: z.array(columnSchema),
  latestUpload: uploadSchema.optional(),
  draftRow: rowSchema.optional(),
});

export type Column = z.infer<typeof columnSchema>;
export type Upload = z.infer<typeof uploadSchema>;
export type ShareLink = z.infer<typeof shareLinkSchema>;
export type Row = z.infer<typeof rowSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type ShareView = z.infer<typeof shareViewSchema>;


