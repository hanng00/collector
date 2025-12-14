"use client";

import { SHARE_TOKEN_KEY } from "@/features/auth/config";
import { getBackendUrl } from "@/lib/config";
import { fetchAuthSession } from "@aws-amplify/auth";
import axios, { AxiosHeaders } from "axios";

export const apiClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const isBrowser = typeof window !== "undefined";

export const getAuthHeaders = async () => {
  if (!isBrowser) {
    return {};
  }
  const headers: Record<string, string> = {};

  // Get Cognito access token
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Also include share link token if present (for anonymous contributors)
  const linkToken = sessionStorage.getItem(SHARE_TOKEN_KEY);
  if (linkToken) {
    headers["X-Link-Token"] = linkToken;
  }

  return headers;
};

apiClient.interceptors.request.use(async (config) => {
  const headers = AxiosHeaders.from(config.headers);
  const authHeaders = await getAuthHeaders();
  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }
  config.headers = headers;
  return config;
});
