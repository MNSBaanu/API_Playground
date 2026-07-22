import type { Collection, Environment, SavedRequest } from "./types";

const COLLECTIONS_KEY = "api-playground:collections:v2";
const LEGACY_COLLECTION_KEY = "api-playground:collection:v1";
const ENVIRONMENTS_KEY = "api-playground:environments:v1";
const ACTIVE_ENV_KEY = "api-playground:active-env:v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadCollections(): Collection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Collection[];
    }
    const legacy = window.localStorage.getItem(LEGACY_COLLECTION_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as SavedRequest[];
      if (Array.isArray(items) && items.length) {
        const migrated: Collection[] = [
          { id: uid(), name: "My Collection", requests: items },
        ];
        window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(migrated));
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
  window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(items));
}

export function loadEnvironments(): Environment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ENVIRONMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Environment[];
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveEnvironments(items: Environment[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(items));
}

export function loadActiveEnvId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ENV_KEY);
}

export function saveActiveEnvId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_ENV_KEY, id);
  else window.localStorage.removeItem(ACTIVE_ENV_KEY);
}
