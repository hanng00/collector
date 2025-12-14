import { LINK_TOKEN_HEADER } from "@/lib/constants";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { decodeJwt } from "jose";

export interface User {
  userId: string;
  email: string;
}

type CognitoClaims = {
  sub: string;
  email: string;
  email_verified: string;
  iss: string;
  origin_jti: string;
  aud: string;
  event_id: string;
  token_use: string;
  auth_time: string;
  exp: string;
  iat: string;
  jti: string;
};

/**
 * Extracts user info from JWT token in Authorization header.
 * Used when API Gateway authorizer is NONE.
 */
const getUserFromToken = (event: APIGatewayProxyEvent): User | null => {
  const authHeader = normalizeHeader(event, "Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = decodeJwt(token);
    
    // Validate token structure (basic checks)
    if (!decoded.sub || !decoded.email) {
      return null;
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: decoded.sub as string,
      email: decoded.email as string,
    };
  } catch {
    return null;
  }
};

/**
 * Returns the user ID and email from the event.
 * First tries to get from API Gateway authorizer context (when Cognito authorizer is used),
 * then falls back to extracting from JWT token in Authorization header (when Authorizer: NONE).
 * Returns null if the user is not authenticated.
 */
export const getUserFromEvent = (event: APIGatewayProxyEvent): User | null => {
  // First try to get from API Gateway authorizer context (when Cognito authorizer is used)
  const authorizer = event.requestContext?.authorizer || null;
  if (authorizer) {
    const claims: CognitoClaims | null = authorizer?.claims || null;
    if (claims) {
      return {
        userId: claims.sub,
        email: claims.email,
      };
    }
  }

  // Fallback: extract from JWT token in Authorization header (when Authorizer: NONE)
  return getUserFromToken(event);
};

export const normalizeHeader = (event: APIGatewayProxyEvent, header: string) => {
  return event.headers?.[header] ?? event.headers?.[header.toLowerCase()] ?? event.headers?.[header.toUpperCase()];
};

export const requireShareLink = (event: APIGatewayProxyEvent): string => {
  const linkToken = normalizeHeader(event, LINK_TOKEN_HEADER);
  if (!linkToken) {
    throw new Error("Share link token missing");
  }
  return linkToken;
};
