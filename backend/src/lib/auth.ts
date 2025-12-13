import type { APIGatewayProxyEvent } from "aws-lambda";
import { LINK_TOKEN_HEADER, OWNER_TOKEN_HEADER } from "./constants";

export type AuthContext = {
  ownerToken?: string;
  linkToken?: string;
};

const normalizeHeader = (event: APIGatewayProxyEvent, header: string) => {
  return event.headers?.[header] ?? event.headers?.[header.toLowerCase()] ?? event.headers?.[header.toUpperCase()];
};

export const getAuthContext = (event: APIGatewayProxyEvent): AuthContext => {
  const ownerToken = normalizeHeader(event, OWNER_TOKEN_HEADER);
  const linkToken = normalizeHeader(event, LINK_TOKEN_HEADER);
  return { ownerToken, linkToken };
};

export const requireOwner = (event: APIGatewayProxyEvent) => {
  const { ownerToken } = getAuthContext(event);
  if (!ownerToken) {
    throw new Error("Owner token missing");
  }
  return ownerToken;
};

export const requireShareLink = (event: APIGatewayProxyEvent) => {
  const { linkToken } = getAuthContext(event);
  if (!linkToken) {
    throw new Error("Share link token missing");
  }
  return linkToken;
};
