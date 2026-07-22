import type { Environment } from "./types";

const TOKEN_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function buildVarMap(env: Environment | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!env) return map;
  for (const v of env.variables) {
    const key = v.key.trim();
    if (key) map[key] = v.value;
  }
  return map;
}

/** Merge environment vars with session vars; session takes precedence. */
export function mergeVars(
  envVars: Record<string, string>,
  sessionVars: Record<string, string>,
): Record<string, string> {
  return { ...envVars, ...sessionVars };
}

export function resolveVars(input: string, vars: Record<string, string>): string {
  if (!input) return input;
  return input.replace(TOKEN_RE, (match, name: string) => {
    return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match;
  });
}

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "var"; name: string; value: string | null };

export function tokenizeWithVars(
  input: string,
  vars: Record<string, string>,
): Segment[] {
  const out: Segment[] = [];
  let lastIndex = 0;
  const re = new RegExp(TOKEN_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) {
      out.push({ kind: "text", text: input.slice(lastIndex, m.index) });
    }
    const name = m[1];
    const value = Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : null;
    out.push({ kind: "var", name, value });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < input.length) {
    out.push({ kind: "text", text: input.slice(lastIndex) });
  }
  return out;
}

/**
 * Resolve a dot/bracket path against a JSON value.
 * Supports: "a.b.c", "users[0].id", "[0].name", "$.a.b" (leading $ optional).
 * Returns null if the path can't be resolved.
 */
export function extractByPath(root: unknown, path: string): unknown {
  const clean = path.trim().replace(/^\$\.?/, "");
  if (!clean) return root;
  const parts: (string | number)[] = [];
  const re = /([^.\[\]]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    if (m[1] !== undefined) parts.push(m[1]);
    else if (m[2] !== undefined) parts.push(Number(m[2]));
  }
  let cur: unknown = root;
  for (const p of parts) {
    if (cur == null) return null;
    if (typeof p === "number") {
      if (!Array.isArray(cur)) return null;
      cur = cur[p];
    } else {
      if (typeof cur !== "object") return null;
      cur = (cur as Record<string, unknown>)[p];
    }
  }
  return cur ?? null;
}

/** Stringify an extracted value for use as a variable. */
export function stringifyExtracted(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
