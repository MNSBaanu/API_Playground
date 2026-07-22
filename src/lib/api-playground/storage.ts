import type { Collection, SavedRequest } from "./types";

const KEY = "api-playground:collections:v2";
const LEGACY_KEY = "api-playground:collection:v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadCollections(): Collection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Collection[];
    }
    // Migrate legacy flat list
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as SavedRequest[];
      if (Array.isArray(items) && items.length) {
        const migrated: Collection[] = [
          { id: uid(), name: "My Collection", requests: items },
        ];
        window.localStorage.setItem(KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveCollections(items: Collection[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}
