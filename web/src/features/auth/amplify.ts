import { Amplify } from "aws-amplify";

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || "",
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
    },
  },
};

let configured = false;

export const configureAmplify = () => {
  if (configured) return;
  if (typeof window === "undefined") return;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    // This is the exact root cause of “Auth UserPool not configured.”
    throw new Error(
      "Auth UserPool not configured. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID (and optionally NEXT_PUBLIC_AWS_REGION)."
    );
  }

  Amplify.configure(amplifyConfig);
  configured = true;
};

// Self-initialize on the client when this module is imported.
configureAmplify();
