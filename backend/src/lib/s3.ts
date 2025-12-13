import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({});

export async function presignPutObject({
  bucket,
  key,
  contentType,
  expiresInSeconds = 15 * 60,
}: {
  bucket: string;
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

export async function getObjectBytes({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}): Promise<{ bytes: Uint8Array; contentType?: string }> {
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const body = res.Body;
  if (!body) return { bytes: new Uint8Array(), contentType: res.ContentType };

  // Node.js runtime returns a Readable stream
  const chunks: Buffer[] = [];
  for await (const chunk of body as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buf = Buffer.concat(chunks);
  return { bytes: new Uint8Array(buf), contentType: res.ContentType };
}


