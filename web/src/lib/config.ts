export const getBackendUrl = () => {
  // `sam local start-api` defaults to 3000.
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
};

// Cognito
export const getCognitoUserPoolId = (): string => {
  return process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";
};

export const getCognitoUserPoolClientId = (): string => {
  return process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || "";
};

export const getCognitoRegion = (): string => {
  return process.env.NEXT_PUBLIC_AWS_REGION || "";
};
