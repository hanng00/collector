export const LINK_TOKEN_HEADER = "x-link-token";
export const AUTHORIZATION_HEADER = "authorization";

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const getDataTableName = () => requireEnv("DATA_TABLE");
export const getUploadBucketName = () => requireEnv("UPLOAD_BUCKET");