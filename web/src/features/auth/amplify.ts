"use client";

import {
  getCognitoRegion,
  getCognitoUserPoolClientId,
  getCognitoUserPoolId,
} from "@/lib/config";
import { Amplify } from "aws-amplify";

let configured = false;

export const configureAmplify = () => {
  if (configured) return;
  if (typeof window === "undefined") return;

  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: getCognitoUserPoolId(),
        userPoolClientId: getCognitoUserPoolClientId(),
        region: getCognitoRegion(),
      },
    },
  };

  Amplify.configure(amplifyConfig);
  configured = true;
};
