"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT_NAME = "dc:workspace-ui";
const SHOW_FILES_SIDEBAR_KEY = "dc:workspace:showFilesSidebar";

function readStoredBoolean(key: string): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function writeStoredBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value ? "true" : "false");
  window.dispatchEvent(new Event(EVENT_NAME));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

function getSnapshot(): boolean {
  // Default: visible
  return readStoredBoolean(SHOW_FILES_SIDEBAR_KEY) ?? true;
}

export function useWorkspaceFilesSidebarVisibility() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, () => true);

  const setVisible = useCallback((next: boolean) => {
    writeStoredBoolean(SHOW_FILES_SIDEBAR_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    writeStoredBoolean(SHOW_FILES_SIDEBAR_KEY, !getSnapshot());
  }, []);

  return { visible, setVisible, toggle };
}


