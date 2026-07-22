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
