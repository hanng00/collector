import type { S3EventHandler } from "aws-lambda";

export const handler: S3EventHandler = async (event) => {
  console.log("Received S3 event for extraction", JSON.stringify(event));

  // Process each created object. Keep it idempotent: everything keys off uploadId.
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name;
    const rawKey = record.s3.object.key;
    const key = decodeURIComponent(rawKey.replaceAll("+", " "));

    // Expected: workspaces/{workspaceId}/uploads/{uploadId}/{fileName}
    const parts = key.split("/");
    const workspaceId = parts[1];
    const uploadId = parts[3];
    if (!workspaceId || !uploadId) {
      console.warn("Unrecognized upload key shape", { key });
      continue;
    }

    try {
      const { processUploadObject } = await import("./extractUploadProcessor.js");
      await processUploadObject({ bucket, key, workspaceId, uploadId });
    } catch (err: any) {
      console.error("Extraction failed", { workspaceId, uploadId, err: err?.message ?? err });
    }
  }
};
