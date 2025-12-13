"use client";

import axios, { AxiosInstance } from "axios";
import { useMemo } from "react";
import { OWNER_TOKEN_KEY, SHARE_TOKEN_KEY } from "../auth/config";
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
          const ownerToken = localStorage.getItem(OWNER_TOKEN_KEY);
          const linkToken = sessionStorage.getItem(SHARE_TOKEN_KEY);
          if (ownerToken) {
            config.headers["X-Owner-Token"] = ownerToken;
          }
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

