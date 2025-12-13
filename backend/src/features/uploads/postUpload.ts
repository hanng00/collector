import { getAuthContext } from "@/lib/auth";
import { getUploadBucketName } from "@/lib/constants";
import { ddbPut } from "@/lib/dynamo";
import { newId } from "@/lib/ids";
import { pk, sk } from "@/lib/keys";
import { presignPutObject } from "@/lib/s3";
import { getOwnerEmailForToken } from "@/lib/owner";
import { ownerCanAccessWorkspace } from "@/lib/workspaceAuth";
import { getShareLinkByToken } from "@/features/links/linkStore";
import { badRequest, created, forbidden, unauthorized } from "@/utils/response";
import { uploadSchema } from "@/contracts";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";

const payloadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().optional(),
  rowId: z.string().optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const workspaceId = event.pathParameters?.workspaceId;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
  }

  const { ownerToken, linkToken } = getAuthContext(event);
  if (!ownerToken && !linkToken) return unauthorized();

  let linkId: string | undefined;
  if (ownerToken) {
    const ownerEmail = await getOwnerEmailForToken(ownerToken);
    if (!ownerEmail) return unauthorized("Invalid owner token");
    const ok = await ownerCanAccessWorkspace({ ownerEmail, workspaceId });
    if (!ok) return forbidden("Workspace not found or not accessible");
  } else if (linkToken) {
    const link = await getShareLinkByToken(linkToken);
    if (!link) return unauthorized("Invalid share link token");
    if (link.workspaceId !== workspaceId) return forbidden("Share link is not valid for this workspace");
    if (!link.permissions.canUpload) return forbidden("Share link does not allow uploads");
    linkId = link.id;
  }

  const body = JSON.parse(event.body ?? "{}");
  const { fileName, contentType, rowId } = payloadSchema.parse(body);

  const uploadId = newId("upl");
  const safeFileName = fileName.replaceAll("/", "_");
  const s3Key = `workspaces/${workspaceId}/uploads/${uploadId}/${safeFileName}`;

  const now = new Date().toISOString();
  const upload = uploadSchema.parse({
    id: uploadId,
    workspaceId,
    rowId,
    linkId,
    fileName,
    status: "pending",
    s3Key,
    createdAt: now,
    updatedAt: now,
  });

  await ddbPut({
    PK: pk.workspace(workspaceId),
    SK: sk.upload(uploadId),
    ...upload,
  });

  const bucket = getUploadBucketName();
  const signedUrl = await presignPutObject({
    bucket,
    key: s3Key,
    contentType,
  });

  return created({ upload, signedUrl });
};
