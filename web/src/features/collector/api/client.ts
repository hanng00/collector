"use client";

import { OWNER_TOKEN_KEY, SHARE_TOKEN_KEY } from "@/lib/auth/config";
import { getBackendUrl } from "@/lib/config";
import axios, { AxiosHeaders } from "axios";

export const apiClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

const isBrowser = typeof window !== "undefined";

export const getAuthHeaders = () => {
  if (!isBrowser) {
    return {};
  }
  const headers: Record<string, string> = {};
  const ownerToken = localStorage.getItem(OWNER_TOKEN_KEY);
  const linkToken = sessionStorage.getItem(SHARE_TOKEN_KEY);
  if (ownerToken) headers["X-Owner-Token"] = ownerToken;
  if (linkToken) headers["X-Link-Token"] = linkToken;
  return headers;
};

apiClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  for (const [key, value] of Object.entries(getAuthHeaders())) {
    headers.set(key, value);
  }
  config.headers = headers;
  return config;
});
