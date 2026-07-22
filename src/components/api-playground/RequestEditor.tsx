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

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type Props = {
  value: RequestState;
  onChange: (next: RequestState) => void;
  onSend: () => void;
  sending: boolean;
  bodyError?: string | null;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function RequestEditor({ value, onChange, onSend, sending, bodyError }: Props) {
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
    <div className="space-y-4">
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
          placeholder="https://api.example.com/endpoint"
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
            <div key={h.id} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={h.key}
                onChange={(e) => updateHeader(h.id, { key: e.target.value })}
                className="font-mono text-sm"
              />
              <Input
                placeholder="Value"
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
          ))}
          <Button variant="outline" size="sm" onClick={addHeader}>
            <Plus className="mr-2 h-4 w-4" />
            Add header
          </Button>
        </TabsContent>

        <TabsContent value="body" className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">JSON body</span>
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
          {bodyError && (
            <p className="text-sm text-destructive">{bodyError}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
