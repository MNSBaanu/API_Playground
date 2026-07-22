import type { SavedRequest } from "./types";

const KEY = "api-playground:collection:v1";

export function loadCollection(): SavedRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveCollection(items: SavedRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}
