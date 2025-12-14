"use client";

import { getAccessToken } from "@/features/auth/client";
import { SHARE_TOKEN_KEY } from "@/features/auth/config";
import axios, { AxiosInstance } from "axios";
import { useMemo } from "react";
import { getBackendUrl } from "../config";

/**
 * Hook that returns a configured axios instance with authentication
 */
export function useAxios(): AxiosInstance {
  return useMemo(() => {
    const instance = axios.create({
      baseURL: getBackendUrl(),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    instance.interceptors.request.use(
      async (config) => {
        if (typeof window !== "undefined") {
          // Get Cognito access token
          const accessToken = await getAccessToken();
          if (accessToken) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
          }
          
          // Also include share link token if present (for anonymous contributors)
          const linkToken = sessionStorage.getItem(SHARE_TOKEN_KEY);
          if (linkToken) {
            config.headers["X-Link-Token"] = linkToken;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.error) {
          return Promise.reject(new Error(error.response.data.error));
        }
        return Promise.reject(
          new Error(error.message || `Something went wrong: ${error.response?.statusText || "Unknown error"}`)
        );
      }
    );

    return instance;
  }, []);
}

