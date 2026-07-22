import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, Trash2 } from "lucide-react";
import type { HeaderRow, HttpMethod, RequestState } from "@/lib/api-playground/types";
import { METHODS_WITH_BODY } from "@/lib/api-playground/types";
import { tokenizeWithVars } from "@/lib/api-playground/variables";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type Props = {
  value: RequestState;
  onChange: (next: RequestState) => void;
  onSend: () => void;
  sending: boolean;
  bodyError?: string | null;
  vars: Record<string, string>;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function TokenPreview({ text, vars }: { text: string; vars: Record<string, string> }) {
  if (!text) return null;
  const segments = tokenizeWithVars(text, vars);
  const hasVars = segments.some((s) => s.kind === "var");
  if (!hasVars) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 px-2 py-1.5 font-mono text-xs">
      <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">
        Resolved
      </span>
      <span className="break-all">
        {segments.map((seg, i) =>
          seg.kind === "text" ? (
            <span key={i}>{seg.text}</span>
          ) : seg.value !== null ? (
            <span
              key={i}
              className="rounded bg-emerald-500/15 px-1 text-emerald-700 dark:text-emerald-400"
              title={`{{${seg.name}}}`}
            >
              {seg.value}
            </span>
          ) : (
            <span
              key={i}
              className="rounded bg-destructive/15 px-1 text-destructive"
              title="Undefined variable"
            >
              {`{{${seg.name}}}`}
            </span>
          ),
        )}
      </span>
    </div>
  );
}

export function RequestEditor({ value, onChange, onSend, sending, bodyError, vars }: Props) {
  const showBody = METHODS_WITH_BODY.includes(value.method);

  const updateHeader = (id: string, patch: Partial<HeaderRow>) => {
    onChange({
      ...value,
      headers: value.headers.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    });
  };

  const addHeader = () => {
    onChange({
      ...value,
      headers: [...value.headers, { id: uid(), key: "", value: "" }],
    });
  };

  const removeHeader = (id: string) => {
    onChange({ ...value, headers: value.headers.filter((h) => h.id !== id) });
  };

  const formatBody = () => {
    try {
      const parsed = JSON.parse(value.body || "{}");
      onChange({ ...value, body: JSON.stringify(parsed, null, 2) });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select
          value={value.method}
          onValueChange={(m) => onChange({ ...value, method: m as HttpMethod })}
        >
          <SelectTrigger className="w-28 font-mono font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m} className="font-mono">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="https://api.example.com/endpoint  or  {{BASE_URL}}/users"
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !sending && value.url) onSend();
          }}
          className="flex-1 font-mono text-sm"
        />
        <Button onClick={onSend} disabled={sending || !value.url}>
          <Send className="mr-2 h-4 w-4" />
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>

      <TokenPreview text={value.url} vars={vars} />

      <Tabs defaultValue={showBody ? "body" : "headers"}>
        <TabsList>
          <TabsTrigger value="headers">
            Headers{value.headers.length ? ` (${value.headers.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="body" disabled={!showBody}>
            Body
          </TabsTrigger>
        </TabsList>

        <TabsContent value="headers" className="space-y-2 pt-3">
          {value.headers.length === 0 && (
            <p className="text-sm text-muted-foreground">No headers.</p>
          )}
          {value.headers.map((h) => (
            <div key={h.id} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Header name"
                  value={h.key}
                  onChange={(e) => updateHeader(h.id, { key: e.target.value })}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="Value  (supports {{VAR}})"
                  value={h.value}
                  onChange={(e) => updateHeader(h.id, { value: e.target.value })}
                  className="font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHeader(h.id)}
                  aria-label="Remove header"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <TokenPreview text={h.value} vars={vars} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addHeader}>
            <Plus className="mr-2 h-4 w-4" />
            Add header
          </Button>
        </TabsContent>

        <TabsContent value="body" className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              JSON body — {"{{variables}}"} are substituted on send
            </span>
            <Button variant="outline" size="sm" onClick={formatBody}>
              Format
            </Button>
          </div>
          <Textarea
            value={value.body}
            onChange={(e) => onChange({ ...value, body: e.target.value })}
            placeholder='{ "key": "value" }'
            className="min-h-[180px] font-mono text-sm"
            spellCheck={false}
          />
          {bodyError && <p className="text-sm text-destructive">{bodyError}</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
